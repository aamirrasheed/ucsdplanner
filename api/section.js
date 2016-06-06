// INSERT A NEW SECTION
exports.post = function(request, response) {
    var sql = "DECLARE @table table (id nvarchar(255)); set nocount on; insert into course_section (course_id, section_id, section_name, type, section_days, section_start_time, section_end_time, location, sec_seats_avail, sec_seats_total, sec_waitlist, professor_id, term_name, term_id) OUTPUT inserted.id into @table values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?); select id from @table;";
    var params = [request.body.course_id, request.body.section_id, request.body.section_name, request.body.type, request.body.section_days, request.body.section_start_time, request.body.section_end_time, request.body.location, request.body.sec_seats_avail, request.body.sec_seats_total,      request.body.sec_waitlist, request.body.professor_id, request.body.term_name, request.body.term_id];
    request.service.mssql.query(sql, params, {
        success: function(results) {
            console.log("BLESS UP THEY DON'T WANT YOU TO SUCCEED");
            response.json(statusCodes.OK, results);
        },
        error: function (results) {
            console.error("POST /courses/section error: " + results);
            response.json(statusCodes.INTERNAL_SERVER_ERROR);
        }
    });
};

function deleteSection(request, response, sectionId, callbackObj) {
    // ANOTHER ONE - old course section deleted
    var sql = "delete from course_section where course_section.id = ?;";
    console.log("WHYYY");
    request.service.mssql.query(sql, sectionId, {
        success: function(results) {
            callbackObj.increment();
            return;
        },
        error: function(results) {
            console.error("Error in deleteSection " + results);
            response.json(statusCodes.INTERNAL_SERVER_ERROR);
        }
    });
}

function deleteExams(request, response, sectionId, callbackObj) {
    var sql = "delete from course_section_exams where course_section_exams.section_id = ?;";
    console.log("GOT HERE FAM");
    request.service.mssql.query(sql, sectionId, {
        success: function(results) {
            callbackObj.increment();
            return;
        },
        error: function(results) {
            console.error("Error in deleteExams " + results);
            response.json(statusCodes.INTERNAL_SERVER_ERROR);
        }
    });
}

function deleteDiscussions(request, response, sectionId, callbackObj) {
    var sql = "delete from course_section_discussions where course_section_discussions.section_id = ?;";
    console.log("OMGOMGOMGOMG");
    request.service.mssql.query(sql, sectionId, {
        success: function(results) {
            callbackObj.increment();
            return;
        },
        error: function(results) {
            console.error("Error in deleteDiscussions " + results);
            response.json(statusCodes.INTERNAL_SERVER_ERROR);
        }
    });
}


exports.register = 
    function(app)
    {
        
        app.post('/batch', function(request, response) {
            
            var responseObj = {
                returned:0,
                expected:4,
                increment:function() {
                    this.returned+=1;
                    this.sendResponse();
                },
                sendResponse:function() {
                    if (this.returned == this.expected) {
                        response.json(statusCodes.OK, {"message":"We good fam"});
                    }
                }
            };
            
            // THEY DON'T WANT ME TO JETSKI - get course id
            var sql1 = "select course_section.id from course_section where course_section.course_id = ? and course_section.professor_id = ?;";
            var params1 = [request.body.course_id, request.body.professor_id];
            request.service.mssql.query(sql1, params1, {
                success: function(results1) {
                    if (results1.length > 0 && false) {
                        console.log("ENTERING IF");
                        deleteSection(request, response, results1[0].id, responseObj, responseObj.increment);
                        deleteDiscussions(request, response, results1[0].id, responseObj, responseObj.increment);
                        deleteExams(request,response, results1[0].id, responseObj, responseObj.increment);
                    }
                    else {
                        console.log("WE HERE FAM");
                        responseObj.expected = 1;
                    }
                    
                    console.log("POINT 2");
    
  
                    // MAJOR KEY - course section inserted
                    var sql2 = "DECLARE @table table (id nvarchar(255)); set nocount on; insert into course_section (course_id, section_id, section_name, type, section_days, section_start_time, section_end_time, location, sec_seats_avail, sec_seats_total, sec_waitlist, professor_id, term_name, term_id) OUTPUT inserted.id into @table values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?); select id from @table;";
                    var params2 = [request.body.course_id, request.body.section_id, request.body.section_name, request.body.type, request.body.section_days, request.body.section_start_time, request.body.section_end_time, request.body.location, request.body.sec_seats_avail, request.body.sec_seats_total, request.body.sec_waitlist, request.body.professor_id, request.body.term_name, request.body.term_id];
                    request.service.mssql.query(sql2, params2, {
                                
                        // RIDE WIT ME ON THE JOURNEY TO MORE SUCCESS - discussions inserted
                        success: function(results2) {
                            var sql3 = "DECLARE @table table (id nvarchar(255)); set nocount on; insert into course_section_discussions (section_id, type, disc_days, disc_start_time, disc_end_time, disc_location, disc_id, disc_name, disc_seats_avail, disc_seats_total, disc_waitlist) values ";
                            var params3 = [];
                            var paramQs3 = [];
                            var paramString3 = "";
                            for (var i = 0; i < request.body.discussions.length; i++) {
                                var r = request.body.discussions[i];
                                params3.push(results2[0].id, r.type, r.disc_days, r.disc_start_time, r.disc_end_time, r.disc_location, r.disc_id, r.disc_name, r.disc_seats_avail, r.disc_seats_total, r.disc_waitlist);
                                paramQs3.push("(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                            }
                            paramString3 = paramQs3.join(', ');
                            sql3 = sql3 + paramString3 + ";";
                            console.log(sql3);
                            if (request.body.discussions.length == 0)
                                sql3 = "set nocount on;"
                            request.service.mssql.query(sql3, params3, {
                                        
                                // YOU SMART, YOU LOYAL - exams inserted
                                success: function (results3) {
                                    var sql4 = "DECLARE @table table (id nvarchar(255)); set nocount on; insert into course_section_exams (section_id, exam_type, exam_start_time, exam_end_time, exam_location, exam_date) values ";
                                    console.log("POINTONTIONTOINT");
                                    var params4 = [];
                                    var paramQs4 = [];
                                    var paramString4 = "";
                                    for (var j = 0; j < request.body.exams.length; j++) {
                                        var e = request.body.exams[j];
                                        params4.push(results2[0].id, e.exam_type, e.exam_start_time, e.exam_end_time, e.exam_location, e.exam_date);
                                        paramQs4.push("(?, ?, ?, ?, ?, ?)");
                                    }
                                    paramString4 = paramQs4.join(', ');
                                    sql4 = sql4 + paramString4 + ";";
                                    if (request.body.exams.length == 0)
                                        sql4 = "set nocount on;"
                                    request.service.mssql.query(sql4, params4, {
                                        success: function(results4) {   
                                            responseObj.increment();
                                        },
                                        error: function(results4) {
                                            console.error("POST /section/batch inner most loop error" + results4);
                                            response.json(statusCodes.INTERNAL_SERVER_ERROR);
                                        }
                                    });
                                },
                                error: function(results6) {
                                    console.error("POST /section/batch inner -1 loop error" + results6);
                                    response.json(statusCodes.INTERNAL_SERVER_ERROR);
                                }
                            });
                        },
                        error: function(results5) {
                            console.error ("POST /section/batch inner loop error" + results5);
                            response.json(statusCodes.INTERNAL_SERVER_ERROR);
                        }
                    });        
                },
                error: function (results4) {
                    console.error("POST /section/batch fourth outer loop error" + results4);
                    response.json(statusCodes.INTERNAL_SERVER_ERROR);
                }
            });     
        });
 
          
            
            
            
            
            
            
 
        
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