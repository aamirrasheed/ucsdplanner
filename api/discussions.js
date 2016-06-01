exports.post = function(request, response) {
    var sql = "DECLARE @table table (id nvarchar(255)); set nocount on; insert into course_section_discussions (section_id, type, disc_days, disc_start_time, disc_end_time, disc_location, disc_id, disc_name, disc_seats_avail, disc_seats_total, disc_waitlist) OUTPUT inserted.id into @table values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?); select id from @table;";
    var params = [request.body.section_id, request.body.type, request.body.disc_days, request.body.disc_start_time, request.body.disc_end_time, request.body.disc_location, request.body.disc_id, request.body.disc_name, request.body.disc_seats_avail, request.body.disc_seats_total, request.body.disc_waitlist];
    request.service.mssql.query(sql, params, {
        success: function(results) {
            response.json(statusCodes.OK, results);
        },
        error: function (results) {
            console.error("POST /discussion error: " + results);
            response.json(statusCodes.INTERNAL_SERVER_ERROR);
        }
    });
};

exports.register = 
    function(app)
    {
        app.get('/:section_id', function (request, response) {
            var sql = "set nocount on; select course_section_discussions.id from course_section_discussions where course_section_discussions.section_id = ? order by course_section_discussions.disc_name ASC;";
            request.service.mssql.query(sql, request.params.section_id, {
                success: function(results) {
                    response.json(statusCodes.OK, results);
                },
                error: function (results) {
                    console.error("GET /discussions/:section_id : " + results);
                    response.json(statusCodes.INTERNAL_SERVER_ERROR);
                }
            });
        });       
        
        // UPDATE A DISCUSSION'S INFORMATION
        app.put('/:discussion_id', function (request, response) {
            var section_id = request.body.section_id ? "section_id = ?" : null;
            var type = request.body.type ? "type = ?" : null;
            var disc_days = request.body.disc_days ? "disc_days = ?" : null;
            var disc_start_time = request.body.disc_start_time ? "disc_start_time = ?" : null;
            var disc_end_time = request.body.disc_end_time ? "disc_end_time = ?" : null;
            var disc_location = request.body.disc_location ? "disc_location = ?" : null;
            var disc_id = request.body.disc_id ? "disc_id = ?" : null;
            var disc_name = request.body.disc_name ? "disc_name = ?" : null;
            var disc_seats_avail = request.body.disc_seats_avail ? "disc_seats_avail = ?" : null;
            var disc_seats_total = request.body.disc_seats_total ? "disc_seats_total = ?" : null;
            var disc_waitlist = request.body.disc_waitlist ? "disc_waitlist = ?" : null;
            var updates = [section_id, type, disc_days, disc_start_time, disc_end_time, disc_location, disc_id, disc_name, disc_seats_avail, disc_seats_total, disc_waitlist].filter(function(val) {return val;}).join(', ');
            var params = [request.body.section_id, request.body.type, request.body.disc_days, request.body.disc_start_time, request.body.disc_end_time, request.body.disc_location, request.body.disc_id, request.body.disc_name, request.body.disc_seats_avail, request.body.disc_seats_total, request.body.disc_waitlist].filter(function(val) {return val;});
            if (params.length === 0) {
                response.json(statusCodes.OK, "No changes made.");
                return;
            }
            for (var i = 0; i < params.length; i++) {
                if (params[i] === ' ')
                    params[i] = null;
            }
            params.push(request.params.discussion_id);
            
            var sql = "set nocount on; update course_section_discussions set " + updates + " where id = ?;";
            request.service.mssql.query(sql, params, {
                success: function(results) {
                    response.json(statusCodes.OK);
                },
                error: function (results) {
                    console.error("PUT /discussions/:section_id : " + results);
                    response.json(statusCodes.INTERNAL_SERVER_ERROR);
                }
            });
        });  
    };