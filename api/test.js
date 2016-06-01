exports.post = function(request, response) {
    // Use "request.service" to access features of your mobile service, e.g.:
    //   var tables = request.service.tables;
    //   var push = request.service.push;

    response.send(statusCodes.OK, { message : 'Hello World!' });
};

exports.get = function(request, response) {
    //var sql = "select professor_id from prof_cape_info full outer join catalog_courses on prof_cape_info.course_id = catalog_courses.id where catalog_courses.course_id = 'CSE 110';";
    var sql = "select * from prof_cape_info where prof_cape_info.course_id = 'A3B3E92F-A63C-4666-9013-68ED3BE5D1B3' and prof_cape_info.professor_id = 'B045C399-A8A7-4077-AAA0-25507928CA60';"
    //var sql = "select top 1 name from professor order by len(name) desc";
    request.service.mssql.query(sql, {
        success: function(results) {
            response.json(statusCodes.OK, results);
        },
        error: function (results) {
            console.error("GET /test error: " + results);
            response.json(statusCodes.INTERNAL_SERVER_ERROR);
        }
    });
};