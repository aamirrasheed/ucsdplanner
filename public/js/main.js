window.addEventListener("load", function () {
  $ = document.querySelectorAll.bind(document);
  
  api = {
    catalog: "https://ucsdplanner-api.azure-mobile.net/api/catalog",
    courses: "https://ucsdplanner-api.azure-mobile.net/api/courses/",
    details: "https://ucsdplanner-api.azure-mobile.net/api/courses/specific/",
    terms: "https://ucsdplanner-api.azure-mobile.net/api/term",
  }
  
  app = {
    search: "",
    course: null,
    courses: [],
    term: {id:"catalog", name:"catalog"},
    terms: [{
      term_id: "catalog",
      term_name: "catalog"
    }],
    terms_expanded: 0,
    is_loading: false,
    show_catalog: true,
    
    clear_search: function () {
      app.search = "";
    },
    select_course: function (e, rv) {
      if (app.course)
        app.course.selected = false;
      app.course = rv.course;
      app.course.selected = true;
      
      document.body.scrollTop = 0;
      
      if (!app.show_catalog && !app.course.details)
        load_course(app.course);
    },
    select_term: function (e, rv) {
      app.terms_expanded = 0;
      if (app.course)
        app.course.selected = false;
      if (app.term.id == e.target.dataset["value"])
        return;
      app.term = {
        id: rv.term.term_id,
        name: rv.term.term_name
      };
      app.show_catalog = app.term.id == "catalog";
      app.course = null;
      app.courses = [];
      app.clear_search();
      load_courses(app.term.id);
    },
    toggle_terms: function () {
      app.terms_expanded ^= 1;
    },
    toggle_expand: function (e, rv) {
      rv.section.expanded ^= 1;
    }
  }
  
  courses = {}

  // document.addEventListener("scroll", function (e) {
  //   console.log(document.body.scrollTop);
  // });
  
  setup_rivets();
  rivets.bind(document.body, {
    app: app
  });
  
  load_terms();
  load_courses("catalog");
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
    var start = obj.section_start_time || obj.disc_start_time || obj.exam_start_time;
    var end = obj.section_end_time || obj.disc_end_time || obj.exam_end_time;
    if (start == "TBA") return "TBA";
    return (start && end) ? start + "-" + end : "";
  }
  
  rivets.formatters.seats = function (obj) {
    if (!obj) return "";
    var avail = obj.section_seats_avail || obj.disc_seats_avail || 0;
    var total = obj.section_seats_total || obj.disc_seats_total || 0;
    if (avail == -1) return "";
    return ~~avail + "/" + total;
  }
  
  rivets.formatters.noyear = function (val) {
    return val.substr(0, val.lastIndexOf("/"));
  }
  
  rivets.formatters.blank = function (val, n) {
    if (val == n) return "";
    return val;
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
    return c
      ? val.toUpperCase()
      : val.toLowerCase();
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
    // $("#course_list li")[0].click();
    document.body.scrollTop = 0;
    $("#course_list")[0].scrollTop = 0;
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
    // $("#course_list li")[0].click();
    app.is_loading = false;
    document.body.scrollTop = 0;
    $("#course_list")[0].scrollTop = 0;
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
    app.terms = app.terms.concat(JSON.parse(e.target.response));
  }
  xhr.open("GET", api.terms);
  xhr.send();
}