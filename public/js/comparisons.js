window.addEventListener("load", function() {
  $ = document.querySelectorAll.bind(document);

  api = {
    catalog: "https://ucsdplanner-api.azure-mobile.net/api/catalog"
  }

  app = {
    show_search: false,
    class_search: "",
    prof_search: "",
    add_class: function () {
      app.fields_div = true;
    },
    profs: [],
    courses: [],    // div for each course in this array
    prof_info: function(e, rv) {
      // database query to get profs for class selected
      // profs returned should populate profs element
    },
    class_info: function(e, rv) {
      // database query to get cape info
      app.show_search = false;
    }
  }

});

rivets.formatters.create_id = function(n) {
  return "pie" + n;
}

rivets.bind(document.body, {
  app: app
});
