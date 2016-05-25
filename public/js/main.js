window.addEventListener("load", function ()  {
  $ = document.querySelectorAll.bind(document);
  
  api = {
    catalog: "https://ucsdplanner-api.azure-mobile.net/api/catalog",
    courses: "https://ucsdplanner-api.azure-mobile.net/api/courses/",
    details: "https://ucsdplanner-api.azure-mobile.net/api/courses/specific/",
    terms: "https://ucsdplanner-api.azure-mobile.net/api/term",
  }
  
  app = {
    fake_capes: [{
      prof: "Gary Gillespie",
      term: "SP15",
      cape_num_evals: 94,
      cape_rec_prof: 79.8,
      cape_study_hrs: 11.03,
      cape_prof_gpa: 3.28,
      overall: 3.2,
      helpfulness: 3.2,
      clarity: 3.1,
      easiness: 2.1
    }, {
      prof: "William Griswold",
      term: "WI14",
      cape_num_evals: 95,
      cape_rec_prof: 84.8,
      cape_study_hrs: 10.36,
      cape_prof_gpa: 3.07,
      overall: 3.6,
      helpfulness: 3.7,
      clarity: 3.5,
      easiness: 3.2
    }],
    search: "",
    tab: 0,
    term: "catalog",
    terms: [],
    course: {},
    courses: [],
    is_loading: true,
    show_catalog: true,
    
    clear_search: function () {
      app.search = "";
    },
    move_selected: function (e, dir) {
      var cur = $("#courses li.selected")[0];
      
      if (!cur) return;
      e.preventDefault();

      // prevent key-repeat firing
      if (keydown) return;
      
      $("#courses")[0].scrollTop += 
        (dir ? 1 : -1) * cur.offsetHeight;
      
      var next = dir ? cur.nextSibling : cur.previousSibling;
      if (next) next.click();
    },
    select_course: function (e, rv) {
      app.course.selected = false;
      app.course = rv.course;
      app.course.selected = true;
      
      if (!app.show_catalog && !app.course.details)
        load_course(app.course);
    },
    select_tab: function (e) {
      if (e.target.classList.contains("greyed")) return;
      app.tab = e.target.value;
    },
    select_term: function (e, rv) {
      app.show_catalog = app.term == "catalog";
      app.course.selected = false;
      app.course = {};
      app.clear_search();
      load_courses(app.term);
    },
    toggle_expand: function (e, rv) {
      rv.section.expanded ^= 1;
    }
  }
  
  // cache for course lists, and course details
  courses = {
    details: []
  }
  
  var keydown;
  
  document.addEventListener("keydown", function (e) {
    switch (e.which) {
      case 38: app.move_selected(e, 0); break;
      case 40: app.move_selected(e, 1); break;
    }
    
    keydown = true;
  });
  
  document.addEventListener("keyup", function (e) {
    keydown = false;
  });
  
  var container = document.body;
  setup_rivets();
  rivets.bind(container, {
    app: app
  });
  
  load_terms();
  load_courses("catalog");
  $("#app")[0].style.display = "";
});

function setup_rivets () {
  rivets.formatters.mark = function (arr, val) {
    if (!arr.length) return arr;
    
    var terms = val.toLowerCase().split(" ");
    
    for (var i = 0; i < arr.length; i++) {
      var show = terms.every(function (term) {
        if (/^[0-9]/.test(term)) term = " " + term;
        var combined = (arr[i].course_id||"")
          + " " + (arr[i].course_name||"");
        return ~combined.toLowerCase().indexOf(term);
      });
      arr[i].hide = !show;
    }
    
    return arr;
  }
  
  rivets.formatters.time = function (obj) {
    if (!obj) return "";
    var start = obj.section_start_time || obj.disc_start_time;
    var end = obj.section_end_time || obj.disc_end_time;
    return (start && end) ? start + "-" + end : "";
  }
  
  rivets.formatters.seats = function (obj) {
    if (!obj) return "";
    var avail = obj.section_seats_avail || obj.disc_seats_avail;
    var total = obj.section_seats_total || obj.disc_seats_total;
    return (total) ? ~~avail + "/" + total : "";
  }
  
  rivets.formatters.replace = function (val, f, r) {
    if (!val) return;
    return val.replace(f, r);
  }
  
  rivets.formatters.grab = function (str, i) {
    var n = /(.+?) ([0-9].*)/.exec(str);
    if (!n) return;
    return n[i+1];
  }
  
  rivets.formatters.eq = function (a, b) {
    return a == b;
  }
  
  rivets.formatters.ne = function (a, b) {
    return a != b;
  }
  
  rivets.formatters.def = function (val) {
    return val != undefined;
  }
  
  rivets.formatters.len = function (arr) {
    if (!arr) return;
    return arr.length;
  }
  
  rivets.formatters.case = function (val, c) {
    if (!val) return;
    if (c == "upper") return val.toUpperCase();
    if (c == "lower") return val.toLowerCase();
    return val;
  }
  
  rivets.formatters.letter = function (gpa) {
    if (gpa == undefined) return;
    return gpa < 1.0 ? "F" : gpa < 1.3
      ? "D"  : gpa < 1.7 ? "D+" : gpa < 2.0
      ? "C-" : gpa < 2.3 ? "C"  : gpa < 2.7
      ? "C+" : gpa < 3.0 ? "B-" : gpa < 3.3
      ? "B"  : gpa < 3.7 ? "B+" : gpa < 4.0
      ? "A-" : "A";
  }
  
  rivets.formatters.fixed = function (val, n) {
    if (val == undefined) return;
    return parseFloat(val).toFixed(n);
  }
}

function course_sort (a, b) {
  var a = /(.+?) ([0-9]+)(.*)/.exec(a.course_id);
  var b = /(.+?) ([0-9]+)(.*)/.exec(b.course_id);
  a[2] = parseInt(a[2]);
  b[2] = parseInt(b[2]);
  
  return a[1] < b[1]
    ? -1 : a[1] > b[1]
    ?  1 : a[2] < b[2]
    ? -1 : a[2] > b[2]
    ?  1 : a[3] < b[3]
    ? -1 : 1;
}

function load_course (course) {
  var url = api.details + course.id;
  
  app.is_loading = true;
  var xhr = new XMLHttpRequest();
  xhr.onload = function (e) {
    // async prevent double-run
    if (course.details) return;
    
    course.details = JSON.parse(e.target.response);
    
    // select first course
    app.is_loading = false;
  }
  xhr.open("GET", url);
  xhr.send();
}

function load_courses (id) {
  if (courses[id]) {
    app.courses = courses[id];
    $("#courses li")[0].click();
    app.tab = 0;
    return;
  }
  
  var url = id == "catalog"
    ? api.catalog
    : api.courses + id;
  
  app.is_loading = true;
  var xhr = new XMLHttpRequest();
  xhr.onload = function (e) {
    // async prevent double-run
    if (courses[id]) return;
    
    courses[id] = JSON.parse(e.target.response);
    courses[id].sort(course_sort);
    app.courses = courses[id];
    
    // select first course
    $("#courses li")[0].click();
    app.is_loading = false;
    app.tab = 0;
  }
  xhr.open("GET", url);
  xhr.send();
}

function load_terms () {
  // prevent re-running this
  if (app.terms.length > 1) return;
  
  var xhr = new XMLHttpRequest();
  xhr.onload = function (e) {
    // async prevent double-run
    if (app.terms.length > 1) return;
    app.terms = JSON.parse(e.target.response);
  }
  xhr.open("GET", api.terms);
  xhr.send();
}