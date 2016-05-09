window.addEventListener("load", function ()  {
  $ = document.querySelectorAll.bind(document);;
  
  api = {
    catalog: "https://ucsdplanner-api.azure-mobile.net/api/catalog",
    terms: "https://ucsdplanner-api.azure-mobile.net/api/term"
  }
  
  app = {
    search: "",
    tab: 0,
    term: "catalog",
    terms: [],
    course: {},
    courses: [],
    is_loading: true,
    show_catalog: true,
    move_selected: function (e, dir) {
      cur = $("#courses li.selected")[0];
      if (!cur) return;
      e.preventDefault();
      $("#courses")[0].scrollTop += 
        (dir ? 1 : -1) * cur.offsetHeight;
      var next = dir ? cur.nextSibling : cur.previousSibling;
      if (next) next.click();
    },
    select_course: function (e, rv) {
      app.course = rv.course;
    },
    select_tab: function (e) {
      app.tab = (app.term == 0) ? 0 : e.target.value;
    },
    select_term: function (e, rv) {
      app.show_catalog = app.term == "catalog";
      load_courses(app.term);
      app.tab = 0;
    },
    toggle_expand: function (e, rv) {
      rv.section.expanded ^= 1;
    }
  }
  
  courses = {}
  
  document.addEventListener("keydown", function (e) {
    switch (e.which) {
      case 38: app.move_selected(e, 0); break;
      case 40: app.move_selected(e, 1); break;
    }
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
  rivets.formatters.search = function (arr, val) {
    var terms = val.toLowerCase().split(" ");
  
    return arr.filter(function (course) {
      return terms.every(function (term) {
        var combined = (course.course_id||"")
          + " " + (course.course_name||"");
        return ~combined.toLowerCase().indexOf(term);
      });
    });
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
  var a = /(.+?) ([0-9]+(.*))/.exec(a.course_id);
  var b = /(.+?) ([0-9]+(.*))/.exec(b.course_id);
  var anum = parseInt(a[2]);
  var bnum = parseInt(b[2]);
  
  return a[1] < b[1]
    ? -1 : a[1] > b[1]
    ?  1 : anum < bnum
    ? -1 : anum > bnum
    ?  1 : a[3] < b[3]
    ? -1 : 1;
}

function load_courses (id) {
  if (courses[id]) {
    app.courses = courses[id];
    $("#courses li")[0].click();
    return;
  }
  
  var url = id == "catalog"
    ? api.catalog
    : api.terms + "/" + id;
  
  app.is_loading = true;
  var xhr = new XMLHttpRequest();
  xhr.onload = function (e) {
    courses[id] = JSON.parse(e.target.response);
    courses[id].sort(course_sort);
    app.courses = courses[id];
    
    // select first course
    $("#courses li")[0].click();
    app.is_loading = false;
  }
  xhr.open("GET", url);
  xhr.send();
}

function load_terms () {
  if (app.terms.length > 1) return;
  
  var xhr = new XMLHttpRequest();
  xhr.onload = function (e) {
    app.terms = JSON.parse(e.target.response);
  }
  xhr.open("GET", api.terms);
  xhr.send();
}