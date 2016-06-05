window.addEventListener("load", function () {
  $ = document.querySelectorAll.bind(document);
  
  api = {
    catalog: "https://ucsdplanner-api.azure-mobile.net/api/catalog",
    rmp: "http://www.ratemyprofessors.com/ShowRatings.jsp?tid=",
    profs: "https://ucsdplanner-api.azure-mobile.net/api/professor/course/",
    compdata: "https://ucsdplanner-api.azure-mobile.net/api/cape/"
  }
  
  app = {
    search: "",
    course: {},
    courses: [],
    comparisons: [],
    no_results: false,
    sidebar_loading: false,
    
    clear_search: function () {
      app.search = "";
    },
    remove_comp: function (e, rv) {
      var i = app.comparisons.indexOf(rv.comp);
      app.comparisons.splice(i, 1);
      
      for (var i = 0; i < app.comparisons.length; i++)
        update_pie_chart(app.comparisons[i]);
    },
    select_course: function (e, rv) {
      if (rv.course != app.course)
        app.course.expanded = 0;
      
      app.course = rv.course;
      rv.course.expanded ^= -1;
      
      load_profs(app.course);
    },
    select_prof: function (e, rv) {
      e.stopPropagation();
      
      if (app.comparisons.some(function (c) {
        return c.prof_name == rv.prof.name
        && c.class_name == rv.course.course_id;
      })) return;
      
      load_comp(rv.prof.id, rv.course);
    },
    select_cape: function (e, rv) {
      var comp = rv.comp;
      for (var i = 0; i < comp.capes.length; i++) {
        if (comp.capes[i].term == comp.cape_term) {
          comp.current_cape = comp.capes[i];
          break;
        }
      }
      
      update_pie_chart(comp);
    }
  }
  
  setup_rivets();
  rivets.bind(document.body, {
    app: app
  });
  
  load_courses("catalog");
});

function setup_rivets () {
  rivets.formatters.mark = function (arr, val) {
    if (!arr.length) return arr;
    $("#course_list")[0].scrollTop = 0;
    
    var terms = val.toLowerCase().split(" ");
    app.no_results = true;
    
    for (var i = 0; i < arr.length; i++) {
      arr[i].hide = !terms.every(function (term) {
        var combined = " " + (arr[i].course_id||"");
        return ~combined.toLowerCase().indexOf(" " + term);
      });
      
      if (!arr[i].hide)
        app.no_results = false;
    }
    
    return arr;
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
    return btoa(comp.prof_name + comp.class_name).replace(/=/g, "");
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

function prof_sort (a, b) {
  var x = a.name.split(" ");
  var y = b.name.split(" ");
  return x[x.length - 1] < y[y.length - 1] ? -1 : 1;
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
  
  var t_percentage = 
    cape.a_percentage +
    cape.b_percentage +
    cape.c_percentage +
    cape.d_percentage +
    cape.f_percentage;
  
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
          "color": "#F38630",
          "caption": (100 * cape.a_percentage / t_percentage).toFixed(2) + "%"
        }, {
          "label": "B",
          "value": cape.b_percentage,
          "color": "#69D2E7",
          "caption": (100 * cape.b_percentage / t_percentage).toFixed(2) + "%"
        }, {
          "label": "C",
          "value": cape.c_percentage,
          "color": "#FA6900",
          "caption": (100 * cape.c_percentage / t_percentage).toFixed(2) + "%"
        }, {
          "label": "D",
          "value": cape.d_percentage,
          "color": "#A7DBD8",
          "caption": (100 * cape.d_percentage / t_percentage).toFixed(2) + "%"
        }, {
          "label": "F",
          "value": cape.f_percentage,
          "color": "#E0E4CC",
          "caption": (100 * cape.f_percentage / t_percentage).toFixed(2) + "%"
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
    "tooltips": {
      "enabled": true,
      "type": "caption"
    },
    "callbacks": {}
  });
}

function load_profs (course) {
  var url = api.profs + course.id;

  var xhr = new XMLHttpRequest();
  xhr.onload = function (e) {
    // async prevent double-run
    if (course.profs) return;
    
    course.profs = JSON.parse(e.target.response);
    course.profs.sort(prof_sort);
  };
  xhr.open("GET", url);
  xhr.send();
}

function load_comp (prof_id, course) {
  var url = api.compdata + "/" + prof_id + "/" + course.id;

  var xhr = new XMLHttpRequest();
  xhr.onload = function (e) {
    var comp = JSON.parse(e.target.response);

    var prof = comp.name.split(" ");
    var cape_url = "http://cape.ucsd.edu/responses/Results.aspx?Name="
      + prof[prof.length - 1].toLowerCase() + "%2C+" + prof[0].toLowerCase()
      + "&CourseNumber=" + course.course_id.replace(/\s/g, "+");
    
    var comp = {
      class_name: course.course_id,
      prof_name: comp.name,
      rmp_url: comp.rmp_tid ? api.rmp + comp.rmp_tid : false,
      cape_url: cape_url,
      rmp: {
        overall: comp.rmp_overall,
        easiness: comp.rmp_easiness,
        helpful: comp.rmp_helpful,
        clarity: comp.rmp_clarity,
        hot: comp.rmp_hot,
      },
      capes: capes_transform(comp.capes)
    }
  
    comp.cape_term = "average";
    comp.current_cape = comp.capes[0];
    app.comparisons.push(comp);
    $("#comps")[0].scrollLeft = 1e6;
    update_pie_chart(comp);
  }
  xhr.open("GET", url);
  xhr.send();
}

function load_courses (id) {
  app.courses = [];
  
  var url = id == "catalog"
    ? api.catalog
    : api.courses + id;
  
  app.sidebar_loading = true;
  var xhr = new XMLHttpRequest();
  xhr.onload = function (e) {
    // async prevent double-run
    
    var courses = JSON.parse(e.target.response);
    courses.sort(course_sort);
    setTimeout(function () {
      app.courses = courses;
      app.sidebar_loading = false;
    }, 200);
    
    $("#course_list")[0].scrollTop = 0;
  }
  xhr.open("GET", url);
  xhr.send();
}