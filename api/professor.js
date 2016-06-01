 // INSERT A NEW PROFESSOR
exports.post = function(request, response) {
    var sql = "DECLARE @table table (id nvarchar(255)); set nocount on; insert into professor (name, rmp_overall, rmp_clarity, rmp_helpful, rmp_easiness, rmp_hot, rmp_tid) OUTPUT inserted.id into @table values (?, ?, ?, ?, ?, ?, ?); select id from @table;";
    var params = [request.body.name, request.body.rmp_overall, request.body.rmp_clarity, request.body.rmp_helpful, request.body.rmp_easiness, request.body.rmp_hot, request.body.rmp_tid];
    request.service.mssql.query(sql, params, {
        success: function(results) {
            response.json(statusCodes.OK, results);
        },
        error: function (results) {
            console.error("POST /professor error: " + results);
            response.json(statusCodes.INTERNAL_SERVER_ERROR);
        }
    });
};

exports.register =
    function(app)
    {
        // INSERT PROFESSOR IF ENTRY DOES NOT ALREADY EXIST, UPDATE OTHERWISE
        app.post('/update', function(request, response) {
            var sql = "set nocount on; select professor.id from professor where professor.name = ?;";

            request.service.mssql.query(sql, request.body.name, {

                success: function(results) {

                    // IF ENTRY DOES NOT EXIST, CREATE ENTRY
                    if (results.length === 0) {
                        var sql_insert = "DECLARE @table table (id nvarchar(255)); set nocount on; insert into professor (name, rmp_overall, rmp_clarity, rmp_helpful, rmp_easiness, rmp_hot, rmp_tid) OUTPUT inserted.id into @table values (?, ?, ?, ?, ?, ?, ?); select id from @table;";
                        
                        var params = [request.body.name, request.body.rmp_overall, request.body.rmp_clarity, request.body.rmp_helpful, request.body.rmp_easiness, request.body.rmp_hot, request.body.rmp_tid];
                        request.service.mssql.query(sql_insert, params, {
                            success: function(results) {
                                response.json(statusCodes.OK, results);
                            },
                            error: function (results) {
                                console.error("POST /professor error: " + results);
                                response.json(statusCodes.INTERNAL_SERVER_ERROR);
                            }
                        });
                    }

                    // IF ENTRY ALREADY EXISTS, UPDATE CURRENT ENTRY
                    else {
                        var name = request.body.name ? "name = ?" : null;
                        var rmp_overall = request.body.rmp_overall ? "rmp_overall = ?" : null;
                        var rmp_helpful = request.body.rmp_helpful ? "rmp_helpful = ?" : null;
                        var rmp_clarity = request.body.rmp_clarity ? "rmp_clarity = ?" : null;
                        var rmp_easiness = request.body.rmp_easiness ? "rmp_easiness = ?" : null;
                        var rmp_hot = request.body.rmp_hot ? "rmp_hot = ?" : null;
                        var rmp_tid = request.body.rmp_tid ? "rmp_tid = ?" : null;

                        var updates = [name, rmp_overall, rmp_helpful, rmp_clarity, rmp_easiness, rmp_hot, rmp_tid].filter(function(val) {return val;}).join(', ');
                        var params = [request.body.name, request.body.rmp_overall, request.body.rmp_helpful, request.body.rmp_clarity, request.body.rmp_easiness, request.body.rmp_hot, request.body.rmp_tid].filter(function(val) {return val;});

                        if (params.length === 0) {
                            response.json(statusCodes.OK, "No changes made.");
                            return;
                        }
                        for (var i = 0; i < params.length; i++) {
                            if (params[i] === ' ')
                                params[i] = null;
                        }

                        console.log("id: ", results);

                        params.push(results[0].id);

                        var sql = "set nocount on; update professor set " + updates + " where id = ?;";

                        console.log("third sql: " + sql);

                        request.service.mssql.query(sql, params, {
                            success: function(results) {
                                response.json(statusCodes.OK);
                            },
                            error: function (results) {
                                console.error("PUT /professor/:id : " + results);
                                response.json(statusCodes.INTERNAL_SERVER_ERROR);
                            }
                        });
                    }
                },

                error: function(results) {
                    console.error("GET /professor/:name : " + results);
                    response.json(statusCodes.INTERNAL_SERVER_ERROR);
                }
            });
        });

        // GET A PROFESSOR_ID FROM A PROFESSOR_NAME
        app.get('/:name', function (request, response) {
            var sql = "set nocount on; select professor.id from professor where professor.name = ?;";
            request.service.mssql.query(sql, request.params.name, {
                success: function(results) {
                    response.json(statusCodes.OK, results);
                },
                error: function (results) {
                    console.error("GET /professor/:name : " + results);
                    response.json(statusCodes.INTERNAL_SERVER_ERROR);
                }
            });
        });

        app.get('/course/:catalog_course_id', function (request, response) {
            var sql = "set nocount on; select professor.id, professor.name from professor full outer join prof_cape_info on prof_cape_info.professor_id = professor.id full outer join catalog_courses on catalog_courses.id = prof_cape_info.course_id where catalog_courses.id = ?;";
            request.service.mssql.query(sql, request.params.catalog_course_id, {
                success: function(results) {
                    //console.log(results);
                    var profs = [];
                    var responseObj = [];
                    for (var i = 0; i < results.length; i++) {
                        if (profs.indexOf(results[i].id) < 0) {
                            profs.push(results[i].id);
                            responseObj.push({name: results[i].name, id: results[i].id});
                        }
                    }
                    response.json(statusCodes.OK, responseObj);
                },
                error: function(results) {
                    console.error("GET /professor/course/:catalog_course_id " + results);
                    response.json(statusCodes.INTERNAL_SERVER_ERROR);
                }
            });
        });

         app.get('/ratings/:catalog_course_id/:professor_id', function (request, response) {
            var sql = "select p.name, p.rmp_overall, p.rmp_helpful, p.rmp_clarity, p.rmp_easiness, p.rmp_hot from professor as p where professor.id = ?;";
	        var catalog_course = response.params.catalog_course_id;
            request.service.mssql.query(sql, request.params.professor_id, {
                success: function(results) {
                    var responseObj = {
                        name:results[0].name,
                        rmp_overall:results[0].rmp_overall,
                        rmp_helpful:results[0].rmp_helpful,
                        rmp_clarity:results[0].rmp_clarity,
                        rmp_easiness:results[0].rmp_easiness,
                        rmp_hot:results[0].rmp_hot,
                        cape_info:[]
                    };
                    var sql2 = "set nocount on; select c.cape_study_hrs, c.cape_prof_gpa, c.cape_num_evals, c.cape_rec_prof, c.term from prof_cape_info as c where c.professor_id = ? and c.course_id = ?;";
                    var params = [request.params.professor_id, catalog_course];
                    request.service.mssql.query(sql, params, {
                        success: function(results) {
                            for (var i = 0; i < results.length; i++) {
                                responseObj.push({cape_study_hrs:results[i].cape_study_hrs, cape_prof_gpa:results[i].cape_prof_gpa, cape_num_evals:results[i].cape_num_evals, cape_rec_prof:results[i].cape_rec_prof, term:results[i].term});
                            }
                            response.json(statusCodes.OK, responseObj);
                        },
                        error: function(results) {
                            response.json(statusCodes.INTERNAL_SERVER_ERROR);
                        }
                    });
                },
                error: function(results) {
                    console.error("GET /professor/ratings/:catalog_course_id/:professor_id " + results);
                    response.json(statusCodes.INTERNAL_SERVER_ERROR);
                }
            });
        });


        // UPDATE A PROFESSOR'S INFORMATION
        app.put('/:id', function (request, response) {
            var name = request.body.name ? "name = ?" : null;
            var rmp_overall = request.body.rmp_overall ? "rmp_overall = ?" : null;
            var rmp_helpful = request.body.rmp_helpful ? "rmp_helpful = ?" : null;
            var rmp_clarity = request.body.rmp_clarity ? "rmp_clarity = ?" : null;
            var rmp_easiness = request.body.rmp_easiness ? "rmp_easiness = ?" : null;
            var rmp_hot = request.body.rmp_hot ? "rmp_hot = ?" : null;
            var rmp_tid = request.body.rmp_tid ? "rmp_tid = ?" : null;

            var updates = [name, rmp_overall, rmp_helpful, rmp_clarity, rmp_easiness, rmp_hot, rmp_tid].filter(function(val) {return val;}).join(', ');
            var params = [request.body.name, request.body.rmp_overall, request.body.rmp_helpful, request.body.rmp_clarity, request.body.rmp_easiness, request.body.rmp_hot, request.body.rmp_tid].filter(function(val) {return val;});

            if (params.length === 0) {
                console.log("No changes made");
                response.json(statusCodes.OK, "No changes made.");
                return;
            }
            for (var i = 0; i < params.length; i++) {
                if (params[i] === ' ')
                    params[i] = null;
            }
            params.push(request.params.id);

            var sql = "set nocount on; update professor set " + updates + " where id = ?;";
            request.service.mssql.query(sql, params, {
                success: function(results) {
                    response.json(statusCodes.OK);
                },
                error: function (results) {
                    console.error("PUT /professor/:id : " + results);
                    response.json(statusCodes.INTERNAL_SERVER_ERROR);
                }
            });
        });
    }
