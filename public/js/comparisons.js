// grade-dist-chart
var pie;

window.addEventListener("load", function() {
  $ = document.querySelectorAll.bind(document);

  api = {
    catalog: "https://ucsdplanner-api.azure-mobile.net/api/catalog",
    courses: "https://ucsdplanner-api.azure-mobile.net/api/courses/",
    details: "https://ucsdplanner-api.azure-mobile.net/api/courses/specific/",
    terms: "https://ucsdplanner-api.azure-mobile.net/api/term",
    profs: "https://ucsdplanner-api.azure-mobile.net/api/professor/course/",
    capesrmps: "https://ucsdplanner-api.azure-mobile.net/api/cape"// /prof/course
  };

  app = {

    // keep track of course_profs on screen
    displayed_course_profs: [],
    /*displayed_course_profs: [
      {
        show: "false",
        course: {
          id: "B8EGSDE7-62D1-6735-9744-182935EB4DD0"
          dept: "CSE",
          code: "110",
          title: "Software Engineering",
        }
        prof: {
          id: "B8EEFDE7-65D1-4035-9744-182935EB4DD0"
          name: "Gary Gillespie",
        }
        current_cape:{}
        current_cape_term:""
        grade_dist_chart:{}
        }
        data: {
          rmp: {
            "overall":0,
            "helpful":0,
            "clarity":0,
            "easiness":0,
            "hot":0,
          }
          capes: [
            {
              "cape_study_hrs":1237,
              "cape_prof_gpa":345,
              "cape_num_evals":85,
              "cape_rec_prof":9380,
              "term":"Average",
              "a_percentage":7100,
              "b_percentage":2000,
              "c_percentage":500,
              "d_percentage":100,
              "f_percentage":100,
              "p_percentage":100,
              "np_percentage":100,
              "cape_url":"https://cape.ucsd.edu/responses/CAPEReport.aspx?sectionid=849755",
              "rcmnd_class":9130
            },
            {
              "cape_study_hrs":1237,
              "cape_prof_gpa":345,
              "cape_num_evals":85,
              "cape_rec_prof":9380,
              "term":"FA15",
              "a_percentage":7100,
              "b_percentage":2000,
              "c_percentage":500,
              "d_percentage":100,
              "f_percentage":100,
              "p_percentage":100,
              "np_percentage":100,
              "cape_url":"https://cape.ucsd.edu/responses/CAPEReport.aspx?sectionid=849755",
              "rcmnd_class":9130
            }
          ]
        }

      }
    ]
    */

    // current course_prof being built
    current_course_prof:{},

    show_search: false,
    
    course_search: "",

    show_course_prof: false,
    prof_id:"",
    is_loading: true,

    profs: [],
    courses: [],

    course: {},
    course_data: [],
    
    change_cape: function(e, rv){
      // var course_id = rv.courseprof.course.id;
      // var prof_id = rv.courseprof.prof.id;
      var capes = rv.courseprof.data.capes;
      var current_cape_term = rv.courseprof.current_cape_term;

      // search through capes to find new one
      for (var i = 0; i < capes.length; i++) {
        if (capes[i].term === current_cape_term){

          rv.courseprof.current_cape = capes[i];  
          
        }
      }

    },

    add_course: function () {
      app.show_search = true;
      load_courses();
    },

    user_selects_course: function (e, rv) {
      
      // get data from rv
      var course_id = rv.course.id;
      var course_name = rv.course.course_id;
      var course_name_array = course_name.split(" ");
      var course_dept = course_name_array[0];
      var course_code = course_name_array[1];
      var course_title = rv.course.course_name;

      // populate current_course_prof
      app.current_course_prof.course = {
        id: course_id,
        dept: course_dept,
        code: course_code,
        title: course_title
      };

      app.current_course_prof.prof = {
        id: "",
        name: ""
      };

      // load profs for dropdown
      load_profs(course_id);
    },
    user_selects_prof: function() {
      // database query to get cape info
      app.show_search = false;
      app.profs = [];
      load_course_prof();
    },
  };

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

function load_profs (course_id) {
  var url = api.profs + course_id;

  app.is_loading = true;
  var xhr = new XMLHttpRequest();
  xhr.onload = function (e) {
    // async prevent double-run
    if (app.profs.length) return;
    var profs = JSON.parse(e.target.response);
    app.profs = profs;
  };
  xhr.open("GET", url);
  xhr.send();
}

function load_course_prof () {
  var url = api.capesrmps + "/" + app.current_course_prof.prof.id + 
      "/" + app.current_course_prof.course.id;

  app.is_loading = true;
  var xhr = new XMLHttpRequest();
  xhr.onload = function (e) {
    // async prevent double-run
    if (app.current_course_prof.data) return;
    var course_prof_data = JSON.parse(e.target.response);
    console.log(course_prof_data);
    populate_course_prof(course_prof_data);
  };
  xhr.open("GET", url);
  xhr.send();
}

function populate_course_prof(course_data){
  // populate professor name
  app.current_course_prof.prof.name = course_data.name;

  // populate rmp info
  app.current_course_prof.data = {
    rmp: {
      overall:course_data.rmp_overall,
      helpfulness: course_data.rmp_helpful,
      clarity: course_data.rmp_clarity,
      easiness: course_data.rmp_easiness,
      hot: course_data.rmp_hot
    },
    capes: course_data.capes,
  };

  // calculate avg cape data
  var total_num_evals = 0;
  var total_study_hrs = 0;
  var total_prof_gpa = 0;
  var total_rec_prof = 0;
  var total_rcmnd_class = 0;
  var total_as = 0;
  var total_bs = 0;
  var total_cs = 0;
  var total_ds = 0;
  var total_fs = 0;
  var total_ps = 0;
  var total_nps = 0;

  // summing up, weighting by num_evals
  for (var i = 0; i < course_data.capes.length; i++){
    total_num_evals += course_data.capes[i].cape_num_evals;
    total_study_hrs += course_data.capes[i].cape_study_hrs * course_data.capes[i].cape_num_evals;
    total_prof_gpa += course_data.capes[i].cape_prof_gpa * course_data.capes[i].cape_num_evals;
    total_rec_prof += course_data.capes[i].cape_rec_prof * course_data.capes[i].cape_num_evals;
    total_rcmnd_class += course_data.capes[i].rcmnd_class * course_data.capes[i].cape_num_evals;
    total_as += course_data.capes[i].a_percentage * course_data.capes[i].cape_num_evals;
    total_bs += course_data.capes[i].b_percentage * course_data.capes[i].cape_num_evals;
    total_cs += course_data.capes[i].c_percentage * course_data.capes[i].cape_num_evals;
    total_ds += course_data.capes[i].d_percentage * course_data.capes[i].cape_num_evals;
    total_fs += course_data.capes[i].f_percentage * course_data.capes[i].cape_num_evals;
    total_ps += course_data.capes[i].p_percentage * course_data.capes[i].cape_num_evals;
    total_nps += course_data.capes[i].np_percentage * course_data.capes[i].cape_num_evals;
  }

  // vars for avg_cape url
  var prof_names = app.current_course_prof.prof.name.split(" ");
  var prof_first_name = prof_names[0].toLowerCase();
  var prof_last_name = prof_names[prof_names.length - 1].toLowerCase();
  var course_dept = app.current_course_prof.course.dept.toLowerCase();
  var course_code = app.current_course_prof.course.code;

  // populate with the average cape
  var avg_cape = {
    cape_num_evals: total_num_evals/course_data.capes.length,
    cape_study_hrs: total_study_hrs/total_num_evals,
    cape_prof_gpa: total_prof_gpa/total_num_evals,
    cape_rec_prof: total_rec_prof/total_num_evals,
    cape_url: "http://cape.ucsd.edu/responses/Results.aspx?Name="+ prof_last_name + 
                  "%2C+"+ prof_first_name + "&CourseNumber="+ course_dept +"+" + course_code,
    rcmnd_class: total_rcmnd_class/total_num_evals,
    term:"Average",
    "a_percentage": total_as/total_num_evals,
    "b_percentage": total_bs/total_num_evals,
    "c_percentage": total_cs/total_num_evals,
    "d_percentage": total_ds/total_num_evals,
    "f_percentage": total_fs/total_num_evals,
    "p_percentage": total_ps/total_num_evals,
    "np_percentage": total_nps/total_num_evals,
  };


  app.current_course_prof.data.capes.unshift(avg_cape);

  app.current_course_prof.current_cape = avg_cape;
  app.current_course_prof.current_cape_term = avg_cape.term;
  app.current_course_prof.grade_dist_chart = 0;

  app.displayed_course_profs.push(app.current_course_prof);

  console.log(app.current_course_prof);

  update_grade_distribution(app.current_course_prof.course.id, app.current_course_prof.prof.id,
                            app.current_course_prof.current_cape_term);

  app.course_search = "";
  app.prof_search = "";
  app.show_course_prof = true;
  
}

function update_grade_distribution(course_id, prof_id, cape_term){

  // find course_prof_to_update
  var course_prof_to_update;
  for(var i = 0; i < app.displayed_course_profs.length; i++){
    if(app.displayed_course_profs[i].course.id === course_id &&
        app.displayed_course_profs[i].prof.id === prof_id){ 
      course_prof_to_update = app.displayed_course_profs[i];
    }
  }
  console.log(course_prof_to_update);

  var a_percentage = course_prof_to_update.current_cape.a_percentage;
  var b_percentage = course_prof_to_update.current_cape.b_percentage;
  var c_percentage = course_prof_to_update.current_cape.c_percentage;
  var d_percentage = course_prof_to_update.current_cape.d_percentage;
  var f_percentage = course_prof_to_update.current_cape.f_percentage;
  var grade_dist_chart = course_prof_to_update.grade_dist_chart;
  var grade_dist_chart_id = course_prof_to_update.course.id; //+ " " + course_prof_to_update.prof.id;

  
  grade_dist_chart = new d3pie(grade_dist_chart_id, {
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
        "content":
        [
            {
                "label": "A",
                "value": a_percentage,
                "color": "#F38630"
            },
            {
                "label": "B",
                "value": b_percentage,
                "color": "#69D2E7"
            },
            {
                "label": "C",
                "value": c_percentage,
                "color": "#FA6900"
            },
            {
                "label": "D",
                "value": d_percentage,
                "color": "#A7DBD8"
            },
            {
                "label": "F",
                "value": f_percentage,
                "color": "#E0E4CC"
            }
        ]
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

}

rivets.formatters.create_id = function(n) {
  return "pie" + n;
};

rivets.formatters.letter = function (gpa) {
    if (gpa == undefined) return;
    gpa /= 100;
    return gpa < 1.0 ? "F" : gpa < 1.3
      ? "D"  : gpa < 1.7 ? "D+" : gpa < 2.0
      ? "C-" : gpa < 2.3 ? "C"  : gpa < 2.7
      ? "C+" : gpa < 3.0 ? "B-" : gpa < 3.3
      ? "B"  : gpa < 3.7 ? "B+" : gpa < 4.0
      ? "A-" : "A";
};
  
rivets.formatters.fixed = function (val, n) {
  if (val == undefined) return;
  return parseFloat(val / 100).toFixed(n);
};

rivets.formatters.rmpformatter = function (val){
  console.log(val);
  if (val === 0){
    return "N/A";
  }
  else {
    return val.toString() + "/5";
  }
};

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
};






