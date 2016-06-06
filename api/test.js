exports.post = function(request, response) {
    // Use "request.service" to access features of your mobile service, e.g.:
    //   

    response.send(statusCodes.OK, { message : 'Hello World!' });
};


exports.get = function(request, response) {
    //var sql = "select professor_id from prof_cape_info full outer join catalog_courses on prof_cape_info.course_id = catalog_courses.id where catalog_courses.course_id = 'CSE 110';";
    //var sql = "select * from prof_cape_info where prof_cape_info.course_id = '349707C0-6CFE-461F-B621-3C57664D359C'and prof_cape_info.professor_id = '10C9308E-E8B7-4372-816F-760411F806DC';"
    //var sql = "select top 1 name from professor order by len(name) desc";
    var sql = "delete from course_section where "
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