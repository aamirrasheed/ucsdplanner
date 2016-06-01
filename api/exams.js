exports.post = function(request, response) {
    var sql = "DECLARE @table table (id nvarchar(255)); set nocount on; insert into course_section_exams (section_id, exam_type, exam_start_time, exam_end_time, exam_location, exam_date) OUTPUT inserted.id into @table values (?, ?, ?, ?, ?, ?); select id from @table;";
    var params = [request.body.section_id, request.body.exam_type, request.body.exam_start_time, request.body.exam_end_time, request.body.exam_location, request.body.exam_date];
    request.service.mssql.query(sql, params, {
        success: function(results) {
            response.json(statusCodes.OK, results);
        },
        error: function (results) {
            console.error("POST /exams error: " + results);
            response.json(statusCodes.INTERNAL_SERVER_ERROR);
        }
    });
};

exports.register = 
    function (app)
    {
        // GET EXAMS BY SECTION_ID
        app.get('/:section_id', function (request, response) {
            var sql = "set nocount on; select course_section_exams.id from course_section_exams where course_section_exams.section_id = ? order by course_section_exams.__createdAt ASC;";
            request.service.mssql.query(sql, request.params.section_id, {
                success: function(results) {
                    response.json(statusCodes.OK, results);
                },
                error: function (results) {
                    console.error("GET /exams/:section_id : " + results);
                    response.json(statusCodes.INTERNAL_SERVER_ERROR);
                }
            });
        }); 
        
                // UPDATE A DISCUSSION'S INFORMATION
        app.put('/:exam_id', function (request, response) {
            var section_id = request.body.section_id ? "section_id = ?" : null;
            var exam_type = request.body.exam_type ? "exam_type = ?" : null;
            var exam_start_time = request.body.exam_start_time ? "exam_start_time = ?" : null;
            var exam_end_time = request.body.exam_end_time ? "exam_end_time = ?" : null;
            var exam_location = request.body.exam_location ? "exam_location = ?" : null;
            var exam_date = request.body.exam_date ? "exam_date = ?" : null;
            var updates = [section_id, exam_type, exam_start_time, exam_end_time, exam_location, exam_date].filter(function(val) {return val;}).join(', ');
            var params = [request.body.section_id, request.body.exam_type, request.body.exam_start_time, request.body.exam_end_time, request.body.exam_location, request.body.exam_date].filter(function(val) {return val;});
            if (params.length === 0) {
                response.json(statusCodes.OK, "No changes made.");
                return;
            }
            for (var i = 0; i < params.length; i++) {
                if (params[i] === ' ')
                    params[i] = null;
            }
            params.push(request.params.exam_id);
            
            var sql = "set nocount on; update course_section_discussions set " + updates + " where id = ?;";
            request.service.mssql.query(sql, params, {
                success: function(results) {
                    response.json(statusCodes.OK);
                },
                error: function (results) {
                    console.error("PUT /exams/:exam_id : " + results);
                    response.json(statusCodes.INTERNAL_SERVER_ERROR);
                }
            });
        });  
    }
