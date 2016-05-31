window.addEventListener("load", function() {
  $ = document.querySelectorAll.bind(document);

  api = {
    catalog: "https://ucsdplanner-api.azure-mobile.net/api/catalog",
    courses: "https://ucsdplanner-api.azure-mobile.net/api/courses/",
    details: "https://ucsdplanner-api.azure-mobile.net/api/courses/specific/",
    terms: "https://ucsdplanner-api.azure-mobile.net/api/term",
    profs: "https://ucsdplanner-api.azure-mobile.net/api/professor/course/"
  }

  app = {
    show_search: false,
    show_class_prof: false,
    class_search: "",
    prof_search: "",
    is_loading: true,
    add_class: function () {
      app.show_search = true;
      load_courses();
    },
    profs: [],
    courses: [], 
    course: {},
    course_data: [],
    all_selected_courses: [],
    select_course: function (e, rv) {
      app.course = rv.course;
      load_course(app.course);
    },
    prof_info: function() {
      // database query to get profs for class selected
      // profs returned should populate profs element
    },
    class_info: function() {
      // database query to get cape info
      app.show_search = false;
      app.profs = [];
      //load_course_prof();
      //make call to rmp
      app.all_selected_courses.push(app.course_data);
      app.class_search = "";
      app.prof_search = "";
      app.show_class_prof = true;
    }
    pie_data:
    [
            {
                "label": "A",
                "value": 85002,
                "color": "#F38630"
            },
            {
                "label": "B",
                "value": 78327,
                "color": "#69D2E7"
            },
            {
                "label": "C",
                "value": 67706,
                "color": "#FA6900"
            },
            {
                "label": "D",
                "value": 36344,
                "color": "#A7DBD8"
            },
            {
                "label": "F",
                "value": 32170,
                "color": "#E0E4CC"
            }
    ]
  }

  rivets.bind(document.body, {
    app: app
  });

});

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

function load_course_prof () {
  var url = ????;

  app.is_loading = true;
  var xhr = new XMLHttpRequest();
  xhr.onload = function (e) {
    // async prevent double-run
    if (app.cape_data.length) return;
    var course_data = JSON.parse(e.target.response);
    app.course_data = course_data;
    app.course_data.course = app.class_search;
    app.course_data.prof = app.prof_search;
  }
  xhr.open("GET", url);
  xhr.send();
}

function load_course (course) {
  var url = api.profs + course.id;

  app.is_loading = true;
  var xhr = new XMLHttpRequest();
  xhr.onload = function (e) {
    // async prevent double-run
    if (app.profs.length) return;
    var profs = JSON.parse(e.target.response);
    app.profs = profs;
  }
  xhr.open("GET", url);
  xhr.send();
}

function load_courses () {
  if (app.courses.length) {
    return;
  }
  
  var url = api.catalog;
  
  app.is_loading = true;
  var xhr = new XMLHttpRequest();
  xhr.onload = function (e) {
    // async prevent double-run
    if (app.courses.length) return;
    var courses = JSON.parse(e.target.response);
    courses.sort(course_sort);
    app.courses = courses;

    app.is_loading = false;
  }
  xhr.open("GET", url);
  xhr.send();
}

function populate_cape_data () {
  }

rivets.formatters.create_id = function(n) {
  return "pie" + n;
}

/*rivets.formatters.search = function (arr, val) {
  if (!val) return arr;

  // split the search into terms
  var terms = val.toLowerCase().split(" ");
  
  // filter the array
  return arr.filter(function (course) {
    // return results that match all of the search terms
    return terms.every(function (term) {
      return (
        ~course.dept.toLowerCase().indexOf(term) ||
        ~course.id.toLowerCase().indexOf(term) ||
        ~course.profs.join(" ").toLowerCase().indexOf(term)
      );
    });
  });
}*/


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

var pie = new d3pie("grade-dist-chart", {
    "header": {
        "title": {
            "fontSize": 41,
            "font": "open sans"
        },
        "subtitle": {
            "color": "#999999",
            "fontSize": 12,
            "font": "open sans"
        },
        "titleSubtitlePadding": 9
    },
    "footer": {
        "color": "#999999",
        "fontSize": 10,
        "font": "open sans",
        "location": "bottom-left"
    },
    "size": {
        "canvasHeight": 250,
        "canvasWidth": 250,
        "pieOuterRadius": "90%"
    },
    "data": {
        "sortOrder": "value-desc",
        "content": app.pie_data
    },
    "labels": {
        "outer": {
            "format":"none",
            "pieDistance": 32
        },
        "inner": {
            "format":"label-percentage1",
            "hideWhenLessThanPercentage": 3
        },
        "mainLabel": {
            "fontSize": 11
        },
        "percentage": {
            "color": "#000000",
            "decimalPlaces": 0
        },
        "value": {
            "color": "#adadad",
            "fontSize": 11
        },
        "lines": {
            "enabled": true
        },
        "truncation": {
            "enabled": true
        }
    },
    "effects": {
        "pullOutSegmentOnClick": {
            "effect": "none",
            "speed": 400,
            "size": 8
        }
    },
    "misc": {
        "gradient": {
            "enabled": false,
            "percentage": 100
        }
    },
    "callbacks": {}
});




