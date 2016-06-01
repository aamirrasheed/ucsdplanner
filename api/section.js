// INSERT A NEW SECTION
exports.post = function(request, response) {
    var sql = "DECLARE @table table (id nvarchar(255)); set nocount on; insert into course_section (course_id, section_id, section_name, type, section_days, section_start_time, section_end_time, location, sec_seats_avail, sec_seats_total, sec_waitlist, professor_id, term_name, term_id) OUTPUT inserted.id into @table values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?); select id from @table;";
    var params = [request.body.course_id, request.body.section_id, request.body.section_name, request.body.type, request.body.section_days, request.body.section_start_time, request.body.section_end_time, request.body.location, request.body.sec_seats_avail, request.body.sec_seats_total,      request.body.sec_waitlist, request.body.professor_id, request.body.term_name, request.body.term_id];
    request.service.mssql.query(sql, params, {
        success: function(results) {
            response.json(statusCodes.OK, results);
        },
        error: function (results) {
            console.error("POST /courses/section error: " + results);
            response.json(statusCodes.INTERNAL_SERVER_ERROR);
        }
    });
};

exports.register = 
    function(app)
    {
        // GET A COURSE_SECTION ID FROM A COURSE_ID AND PROFESSOR_ID
        app.get('/:course_id/:professor_id', function (request, response) {
            var sql = "set nocount on; select course_section.id from course_section where course_section.course_id = ? and course_section.professor_id = ?;";
            var params = [request.params.course_id, request.params.professor_id];
            request.service.mssql.query(sql, params, {
                success: function(results) {
                    response.json(statusCodes.OK, results);
                },
                error: function (results) {
                    console.error("GET /section/:course_id/:professor_id error: " + results);
                    response.json(statusCodes.INTERNAL_SERVER_ERROR);
                }
            });
        });
        
        // GET ALL DATA FROM TABLE FROM A SECTION_ID
        app.get('/:section_id', function (request, response) {
            var sql = "set nocount on; select * from course_section where course_section.id = ?;";
            var params = [request.params.section_id];
            request.service.mssql.query(sql, params, {
                success: function(results) {
                    response.json(statusCodes.OK, results);
                },
                error: function (results) {
                    console.error("GET /section/:section_id error: " + results);
                    response.json(statusCodes.INTERNAL_SERVER_ERROR);
                }
            });
        });
        
        // UPDATE A SECTION'S INFORMATION
        app.put('/:id', function (request, response) {
            var course_id = request.body.course_id ? "course_id = ?" : null;
            var section_id = request.body.section_id ? "section_id = ?" : null;
            var section_name = request.body.section_name ? "section_name = ?" : null;
            var type = request.body.type ? "type = ?" : null;
            var section_days = request.body.section_days ? "section_days = ?" : null;
            var section_start_time = request.body.section_start_time ? "section_start_time = ?" : null;
            var section_end_time = request.body.section_end_time ? "section_end_time = ?" : null;
            var location = request.body.location ? "location = ?" : null;
            var sec_seats_avail = request.body.sec_seats_avail ? "sec_seats_avail = ?" : null;
            var sec_seats_total = request.body.sec_seats_total ? "sec_seats_total = ?" : null;
            var sec_waitlist = request.body.sec_waitlist ? "sec_waitlist = ?" : null;
            var professor_id = request.body.professor_id ? "professor_id = ?" : null;
            var updates = [course_id, section_id, section_name, type, section_days, section_start_time, section_end_time, location, sec_seats_avail, sec_seats_total, sec_waitlist, professor_id].filter(function(val) {return val;}).join(', ');
            var params = [request.body.course_id, request.body.section_id, request.body.section_name, request.body.type, request.body.section_days, request.body.section_start_time, request.body.section_end_time, request.body.location, request.body.sec_seats_avail, request.body.sec_seats_total, request.body.sec_waitlist, request.body.professor_id].filter(function(val) {return val;});
            if (params.length === 0) {
                response.json(statusCodes.OK, "No changes made.");
                return;
            }
            for (var i = 0; i < params.length; i++) {
                if (params[i] === ' ')
                    params[i] = null;
            }
            params.push(request.params.id);
            
            var sql = "set nocount on; update course_section set " + updates + " where id = ?;";
            request.service.mssql.query(sql, params, {
                success: function(results) {
                    response.json(statusCodes.OK);
                },
                error: function (results) {
                    console.error("PUT /section/:id : " + results);
                    response.json(statusCodes.INTERNAL_SERVER_ERROR);
                }
            });
        });    
    }