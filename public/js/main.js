window.addEventListener("load", function ()  {
  var app = {
    search: "",
    terms: ["Catalog", "Winter 2016", "Spring 2016"],
    courses: [{
      dept: "DEPT",
      num: "100",
      title: "this is a really long test title that is going to overflow",
      sections: [812345, 812346, 812347]
    }],
    tab: 0,
    course: {
      dept: "DEPT",
      num: "100",
      title: "class title goes here",
      description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      prereqs: "none",
      gpa: 4.2,
      workload: 69,
      units: "69",
      seats: "420/1337",
      sections: [{
        section: "A00",
        id: 812345,
        type: "LE",
        days: "TuTh",
        time: "12:00p-1:20p",
        location: "WLH 2005",
        professor: "your mother",
        seats: "0/100",
        waitlist: 200,
        expanded: 0,
        subsections: [{
          section: "A01",
          id: "",
          type: "DI",
          days: "W",
          time: "12:00p-1:20p",
          location: "WLH 2005",
          professor: "your mother",
          seats: "",
          waitlist: ""
        }]
      },{
        section: "B00",
        id: 812345,
        type: "LE",
        days: "TuTh",
        time: "12:00p-1:20p",
        location: "WLH 2005",
        professor: "your mother",
        seats: "0/100",
        waitlist: 200,
        expanded: 0,
        subsections: [{
          section: "B01",
          id: 812345,
          type: "LE",
          days: "TuTh",
          time: "12:00p-1:20p",
          location: "WLH 2005",
          professor: "your mother",
          seats: "0/100",
          waitlist: 200
        }]
      }]
    },
    select_tab: function (e) {
      app.tab = e.target.value;
    },
    toggle_expand: function (e, rv) {
      rv.section.expanded ^= 1;
    }
  }
  
  rivets.formatters.search = function (arr, val) {
    // split the search into terms
    var terms = val.toLowerCase().split(" ");
  
    // filter the array
    return arr.filter(function (course) {
      // return results that match all of the search terms
      return terms.every(function (term) {
        return (
          ~course.dept.toLowerCase().indexOf(term) ||
          ~course.num.toLowerCase().indexOf(term) ||
          ~course.sections.join(" ").indexOf(term)
        );
      });
    });
  }
  
  rivets.formatters.eq = function (a, b) {
    return a == b;
  }
  
  rivets.formatters.length = function (arr) {
    return arr.length;
  }
  
  rivets.formatters.letter = function (gpa) {
    return gpa < 1.0
    ? "F"  : gpa < 1.3
    ? "D"  : gpa < 1.7
    ? "D+" : gpa < 2.0
    ? "C-" : gpa < 2.3
    ? "C"  : gpa < 2.7
    ? "C+" : gpa < 3.0
    ? "B-" : gpa < 3.3
    ? "B"  : gpa < 3.7
    ? "B+" : gpa < 4.0
    ? "A-" : "A";
  }
  
  rivets.formatters.fixed = function (val, n) {
    return parseFloat(val).toFixed(n);
  }
  
  var container = document.querySelector("#app");
  
  rivets.bind(container, {
    app: app
  });
  
  container.style.display = "";
});
