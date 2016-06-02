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
    comparisons: [],
    term: {id:"catalog", name:"catalog"},
    terms: [{
      term_id: "catalog",
      term_name: "catalog"
    }],
    terms_expanded: 0,
    no_results: false,
    sidebar_loading: false,
    details_loading: false,
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
      
      if (!app.show_catalog)
        load_course(app.course);
    },
    select_cape: function (e, rv) {
      var comp = rv.comp;
      for (var i=0; i<comp.capes.length; i++) {
        if (comp.capes[i].term == comp.cape_term) {
          comp.current_cape = comp.capes[i];
          break;
        }
      }
      
      update_pie_chart(comp);
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
      if (!rv.section.no_subsections)
        rv.section.expanded ^= 1;
    }
  }
  
  courses = {}

  document.addEventListener("scroll", function (e) {
    var tabs = ["overview", "sections", "comparisons"];
    if (app.show_catalog) tabs.splice(1, 1);
    
    for (var i = 0; i < tabs.length; i++) {
      if ($("#" + tabs[i])[0].offsetTop + $("#" + tabs[i])[0].clientHeight - document.body.scrollTop > 0) {
        $("#tabs")[0].className = $("#tabs")[0].className.replace(/t[0-9]/g, "t" + (i+1));
        break;
      }
    }
  });
  
  setup_rivets();
  rivets.bind(document.body, {
    app: app
  });
  
  load_terms();
  load_courses("catalog");
});

function scroll_to (id) {
  window.scrollTo(0, $("#" + id)[0].offsetTop - 20);
}

function setup_rivets () {
  rivets.formatters.mark = function (arr, val) {
    if (!arr.length) return arr;
    
    var terms = val.toLowerCase().split(" ");
    app.no_results = true;
    
    for (var i = 0; i < arr.length; i++) {
      arr[i].hide = !terms.every(function (term) {
        // if (/^[0-9]/.test(term)) term = " " + term;
        var combined = " " + (arr[i].course_id||"")
          + " " + (arr[i].course_name||"");
        return ~combined.toLowerCase().indexOf(" " + term);
      });
      
      if (!arr[i].hide)
        app.no_results = false;
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
    var avail = obj.seats_avail || obj.section_seats_avail || obj.disc_seats_avail || 0;
    var total = obj.seats_total || obj.section_seats_total || obj.disc_seats_total || 0;
    if (avail == -1) return "";
    return ~~avail + "/" + total;
  }
  
  rivets.formatters.noyear = function (val) {
    return val.substr(0, val.lastIndexOf("/"));
  }
  
  rivets.formatters.na = function (val) {
    return (!val && val !== 0 || val < 0) ? "N/A" : val;
  }
  
  rivets.formatters.is_na = function (val) {
    return (!val && val !== 0 || val < 0);
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
  
  rivets.formatters.and = function (a, b) {
    return a && b;
  }
  
  rivets.formatters.or = function (a, b) {
    return a || b;
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
  
  rivets.formatters.rmp = function (val) {
    if (!val) return "N/A";
    return parseFloat(val).toFixed(1) + "/5"
  }
  
  rivets.formatters.case = function (val, c) {
    if (!val) return;
    return c
      ? val.toUpperCase()
      : val.toLowerCase();
  }
  
  rivets.formatters.letter = function (gpa) {
    if (gpa == undefined) return;
    gpa /= 100;
    return gpa < 0 ? "" : gpa < 1.0
      ? "F" : gpa < 1.3 ? "D"  : gpa < 1.7 
      ? "D+" : gpa < 2.0 ? "C-" : gpa < 2.3 
      ? "C"  : gpa < 2.7 ? "C+" : gpa < 3.0 
      ? "B-" : gpa < 3.3 ? "B"  : gpa < 3.7 
      ? "B+" : gpa < 4.0 ? "A-" : "A";
  }
  
  rivets.formatters.fixed = function (val, n) {
    if (val == undefined) return;
    return parseFloat(val / 100).toFixed(n);
  }
  
  rivets.formatters.pie = function (comp) {
    return btoa(comp.professor_name).replace(/=/g, "");
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

function cape_average (cape_a, cape_b) {
  var cape = JSON.parse(JSON.stringify(cape_a));
  
  var a_evals = cape_a.cape_num_evals;
  var b_evals = cape_b.cape_num_evals;
  var t_evals = a_evals + b_evals;
  cape.cape_num_evals = t_evals;
  
  for (var i in cape) {
    // ignore these properties
    if (~["term", "cape_num_evals", "cape_id"].indexOf(i)) continue;
    
    var a_def = cape_a[i] !== null && cape_a[i] >= 0;
    var b_def = cape_b[i] !== null && cape_b[i] >= 0;
    
    if (a_def && b_def)
      cape[i] = (cape_a[i] * a_evals + cape_b[i] * b_evals) / t_evals;
    else if (b_def)
      cape[i] = cape_b[i];
  }
  
  return cape;
}

function capes_transform (capes) {
  if (!capes.length) return [];
  
  var terms = {"WI": 0, "SP":1, "S1":2, "S2":3, "FA":4};
  var term_regex = /([A-Z0-9]{2})([0-9]{2})/;

  var term_sort = function (a, b) {
    a_term = terms[term_regex.exec(a.term)[1]];
    b_term = terms[term_regex.exec(b.term)[1]];
  	a_yr = ~~term_regex.exec(a.term)[2];
    b_yr = ~~term_regex.exec(b.term)[2];
    
    return a_yr > b_yr
      ? -1 : a_yr < b_yr
      ?  1 : a_term > b_term
      ? -1 : 1;
  }
  
  capes.sort(term_sort);
  
  for (var i = 0; i < capes.length - 1; i++) {
    for (var j = i + 1; j < capes.length; j++) {
      if (capes[i].term != capes[j].term) continue;
      capes[i] = cape_average(capes[i], capes[j]);
      capes.splice(j--, 1);
    }
  }
  
  var avg = JSON.parse(JSON.stringify(capes[0]));
  avg.term = "average";
  
  for (var i = 1; i < capes.length; i++)
    avg = cape_average(avg, capes[i]);
  
  capes.unshift(avg);
  
  return capes;
}

function update_pie_chart (comp) {
  var id = rivets.formatters.pie(comp);
  var cape = comp.current_cape;
  
  $("#" + id)[0].innerHTML = "";
  
  var grade_dist_chart = new d3pie(id, {
    "size": {
      "canvasHeight": 200,
      "canvasWidth": 200,
      "pieOuterRadius": "90%"
    },
    "data": {
      "sortOrder": "label-asc",
      "content": [
        {
          "label": "A",
          "value": cape.a_percentage,
          "color": "#F38630"
        }, {
          "label": "B",
          "value": cape.b_percentage,
          "color": "#69D2E7"
        }, {
          "label": "C",
          "value": cape.c_percentage,
          "color": "#FA6900"
        }, {
          "label": "D",
          "value": cape.d_percentage,
          "color": "#A7DBD8"
        }, {
          "label": "F",
          "value": cape.f_percentage,
          "color": "#E0E4CC"
        }
      ]
    },
    "labels": {
      "inner": {
        "format": "label",
        "hideWhenLessThanPercentage": 3
      },
      "outer": {
        "format": "none"
      },
      "mainLabel": {
        "fontSize": 11
      },
      "value": {
        "color": "#adadad",
        "fontSize": 11
      },
      "truncation": {
        "enabled": true
      }
    },
    "effects": {
      "load": {
  			"effect": "none"
      },
  		"pullOutSegmentOnClick": {
  			"effect": "none"
  		},
    },
    "callbacks": {}
  });
}

function load_course (course) {
  if (course.details) {
    console.log("hi mom");
    for (var i = 0; i < course.details.comparisons.length; i++)
      update_pie_chart(course.details.comparisons[i]);
    return;
  }
  
  var url = api.details + course.id;
  
  app.details_loading = true;
  var xhr = new XMLHttpRequest();
  xhr.onload = function (e) {
    // async prevent double-run
    if (course.details) return;
    
    course.details = JSON.parse(e.target.response);
    
    var uniq_profs = ["Staff"];
    course.details.comparisons = [];
    
    // mark sections if they don't have subsections
    // also populate comparisons
    var sections = course.details.course_sections;
    course.num_sections = sections.length;
    for (var i = 0; i < sections.length; i++) {
      var s = sections[i];
      s.no_subsections = !(s.discussions.length + s.exams.length);
      
      if (!~uniq_profs.indexOf(s.professor_name)) {
        uniq_profs.push(s.professor_name);
        var comp = {
          professor_name: s.professor_name,
          rmp: {
            tid: s.rmp_tid,
            overall: s.rmp_overall,
            easiness: s.rmp_easiness,
            helpful: s.rmp_helpful,
            clarity: s.rmp_clarity,
            hot: s.rmp_hot,
          },
          capes: capes_transform(s.cape_info)
        }
        
        if (comp.capes.length) {
          comp.cape_term = "average";
          comp.current_cape = comp.capes[0];
          course.details.comparisons.push(comp);
          update_pie_chart(comp);
        }
      }
    }
    
    if (!course.details.comparisons.length)
      course.details.comparisons = false;
    
    // select first course
    app.details_loading = false;
  }
  xhr.open("GET", url);
  xhr.send();
}

function load_courses (id) {
  app.courses = [];
  
  if (courses[id]) {
    app.sidebar_loading = true;
    setTimeout(function () {
      app.courses = courses[id];
      app.sidebar_loading = false;
    }, 200);
    
    document.body.scrollTop = 0;
    $("#course_list")[0].scrollTop = 0;
    return;
  }
  
  var url = id == "catalog"
    ? api.catalog
    : api.courses + id;
  
  app.sidebar_loading = true;
  var xhr = new XMLHttpRequest();
  xhr.onload = function (e) {
    // async prevent double-run
    if (courses[id]) return;
    
    courses[id] = JSON.parse(e.target.response);
    courses[id].sort(course_sort);
    setTimeout(function () {
      app.courses = courses[id];
      app.sidebar_loading = false;
    }, 200);
    
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