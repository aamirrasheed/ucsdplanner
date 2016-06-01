exports.get = function(request, response) {
    var sql = "set nocount on; select c.id, c.course_name, c.course_id, c.description, c.prereqs, c.units from catalog_courses as c order by c.course_name;";
    request.service.mssql.query(sql, {
        success: function(results) {
            response.json(statusCodes.OK, results);
        },
        error: function (results) {
            console.error("GET /catalog error: " + results);
            response.json(statusCodes.INTERNAL_SERVER_ERROR);
        }
    });
};
        
exports.post = function(request, response) {
    var sql = "DECLARE @table table (id nvarchar(255)); set nocount on; insert into catalog_courses (course_name, course_id, description, prereqs, units) OUTPUT inserted.id into @table values (?, ?, ?, ?, ?); select id from @table;";
    var params = [request.body.course_name, request.body.course_id, request.body.description, request.body.prereqs, request.body.units];
    request.service.mssql.query(sql, params, {
        success: function(results) {
            response.json(statusCodes.OK, results);
        },
        error: function (results) {
            console.error("POST /catalog error: " + results);
            response.json(statusCodes.INTERNAL_SERVER_ERROR);
        }
    });
};

exports.register = 
    function(app)
    {
        app.get('/:course_id', function (request, response) {
            var sql = "set nocount on; select c.id, c.course_name, c.course_id, c.description, c.prereqs, c.units from catalog_courses as c where c.course_id = ?;";
            request.service.mssql.query(sql, request.params.course_id, {
                success: function(results) {
                    response.json(statusCodes.OK, results);
                },
                error: function (results) {
                    console.error("GET /courses/catalog/:course_id error: " + results);
                    response.json(statusCodes.INTERNAL_SERVER_ERROR);
                }
            });
        });
        
        // UPDATE A CATALOG COURSES'S INFORMATION
        app.put('/:id', function (request, response) {
            var course_name = request.body.course_name ? "course_name = ?" : null;
            var course_id = request.body.course_id ? "course_id = ?" : null;
            var description = request.body.description ? "description = ?" : null;
            var prereqs = request.body.prereqs ? "prereq = ?" : null;
            var units = request.body.units ? "units = ?" : null;
            var updates = [course_name, course_id, description, prereqs, units].filter(function(val) {return val;}).join(', ');
            var params = [request.body.course_name, request.body.course_id, request.body.description, request.body.prereqs, request.body.units].filter(function(val) {return val;});
            if (params.length == 0) {
                response.json(statusCodes.OK, "No changes made.");
                return;
            }
            params.push(request.params.id);
            console.log(request.body.description);
            var sql= "update catalog_courses set " + updates + " where id = ?;";
            console.log(sql);

            request.service.mssql.query(sql, params, {
                success: function(results) {
                    response.json(statusCodes.OK);
                },
                error: function (results) {
                    console.error("PUT /catalog/:id : " + results);
                    response.json(statusCodes.INTERNAL_SERVER_ERROR);
                }
            });
        });    
    };
        