// INSERT A CAPE REVIEW
exports.post = function(request, response) {
    var sql = "DECLARE @table table (id nvarchar(255)); set nocount on; insert into prof_cape_info (cape_study_hrs, cape_prof_gpa, cape_num_evals, cape_rec_prof, term, professor_id, course_id, a_percentage, b_percentage, c_percentage, d_percentage, f_percentage, p_percentage, np_percentage, cape_url, rcmnd_class) OUTPUT inserted.id into @table values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?); select id from @table;";
    var params = [request.body.cape_study_hrs, request.body.cape_prof_gpa, request.body.cape_num_evals, request.body.cape_rec_prof, request.body.term, request.body.professor_id, request.body.course_id, request.body.a_percentage, request.body.b_percentage, request.body.c_percentage, request.body.d_percentage, request.body.f_percentage, request.body.p_percentage, request.body.np_percentage, request.body.cape_url, request.body.rcmnd_class];
    request.service.mssql.query(sql, params, {
        success: function(results) {
            response.json(statusCodes.OK, results);
        },
        error: function (results) {
            console.error("POST /courses/cape error: " + results);
            response.json(statusCodes.INTERNAL_SERVER_ERROR);
        }
    });
};

exports.register =
    function(app)
    {
        // INSERT CAPE IF ENTRY DOES NOT ALREADY EXIST, UPDATE OTHERWISE
        app.post('/update', function(request, response) {
          var sql = "set nocount on; select prof_cape_info.id from prof_cape_info where prof_cape_info.professor_id = ? and prof_cape_info.course_id = ? and prof_cape_info.term = ?;";
          var params = [request.body.professor_id, request.body.course_id, request.body.term];

          request.service.mssql.query(sql, params, {

            success: function(results) {

              // IF ENTRY DOES NOT EXIST, CREATE ENTRY
              if (results.length === 0) {
                sql = "DECLARE @table table (id nvarchar(255)); set nocount on; insert into prof_cape_info (cape_study_hrs, cape_prof_gpa, cape_num_evals, cape_rec_prof, term, professor_id, course_id, a_percentage, b_percentage, c_percentage, d_percentage, f_percentage, p_percentage, np_percentage, cape_url, rcmnd_class) OUTPUT inserted.id into @table values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?); select id from @table;";

                params = [request.body.cape_study_hrs, request.body.cape_prof_gpa, request.body.cape_num_evals, request.body.cape_rec_prof, request.body.term, request.body.professor_id, request.body.course_id, request.body.a_percentage, request.body.b_percentage, request.body.c_percentage, request.body.d_percentage, request.body.f_percentage, request.body.p_percentage, request.body.np_percentage, request.body.cape_url, request.body.rcmnd_class];

                request.service.mssql.query(sql, params, {
                    success: function(results) {
                        response.json(statusCodes.OK, results);
                    },
                    error: function (results) {
                        console.error("POST /courses/cape error: " + results);
                        response.json(statusCodes.INTERNAL_SERVER_ERROR);
                    }
                });
              }

                // IF ENTRY ALREADY EXISTS, UPDATE CURRENT ENTRY
                else {
                  var cape_study_hrs = request.body.cape_study_hrs ? "cape_study_hrs = ?" : null;
                  var cape_prof_gpa = request.body.cape_prof_gpa ? "cape_prof_gpa = ?" : null;
                  var cape_num_evals = request.body.cape_num_evals ? "cape_num_evals = ?" : null;
                  var cape_rec_prof = request.body.cape_rec_prof ? "cape_rec_prof = ?" : null;
                  var term = request.body.term ? "term = ?" : null;
                  var professor_id = request.body.professor_id ? "professor_id = ?" : null;
                  var course_id = request.body.course_id ? "course_id = ?" : null;
                  var a_percentage = request.body.a_percentage ? "a_percentage = ?" : null;
                  var b_percentage = request.body.b_percentage ? "b_percentage = ?" : null;
                  var c_percentage = request.body.c_percentage ? "c_percentage = ?" : null;
                  var d_percentage = request.body.d_percentage ? "d_percentage = ?" : null;
                  var f_percentage = request.body.f_percentage ? "f_percentage = ?" : null;
                  var p_percentage = request.body.p_percentage ? "p_percentage = ?" : null;
                  var np_percentage = request.body.np_percentage ? "np_percentage = ?" : null;
                  var cape_url = request.body.cape_url ? "cape_url = ?" : null;
                  var rcmnd_class = request.body.rcmnd_class ? "rcmnd_class = ?" : null;

                  var updates = [cape_study_hrs, cape_prof_gpa, cape_num_evals, cape_rec_prof, term, professor_id, course_id, a_percentage, b_percentage, c_percentage, d_percentage, f_percentage, p_percentage, np_percentage, cape_url, rcmnd_class].filter(function(val) {return val;}).join(', ');
                  var params = [request.body.cape_study_hrs, request.body.cape_prof_gpa, request.body.cape_num_evals, request.body.cape_rec_prof, request.body.term, request.body.professor_id, request.body.course_id, request.body.a_percentage, request.body.b_percentage, request.body.c_percentage, request.body.d_percentage, request.body.f_percentage, request.body.p_percentage, request.body.np_percentage, request.body.cape_url, request.body.rcmnd_class].filter(function(val) {return val;});

                  if (params.length === 0) {
                      response.json(statusCodes.OK, "No changes made.");
                      return;
                  }
                  for (var i = 0; i < params.length; i++) {
                      if (params[i] === ' ')
                          params[i] = null;
                  }

                  params.push(results[0].id);

                  sql = "set nocount on; update prof_cape_info set " + updates + " where id = ?;";
                  request.service.mssql.query(sql, params, {
                      success: function(results) {
                          response.json(statusCodes.OK);
                      },
                      error: function (results) {
                          console.error("PUT /cape/:id : " + results);
                          response.json(statusCodes.INTERNAL_SERVER_ERROR);
                      }
                  });
                }
              },

            error: function(results) {
                console.error("GET /cape/:professor_id/:course_id/ : " + results);
                response.json(statusCodes.INTERNAL_SERVER_ERROR);
            }
          });
        });

       // GET A PROF'S CAPE INFO FROM PROFESSOR_ID, COURSE_ID, AND TERM
        app.get('/:professor_id/:course_id/:term', function (request, response) {
            var sql = "set nocount on; select prof_cape_info.id from prof_cape_info where prof_cape_info.professor_id = ? and prof_cape_info.course_id = ? and prof_cape_info.term = ?;";
            var params = [request.params.professor_id, request.params.course_id, request.params.term];
            request.service.mssql.query(sql, params, {
                success: function(results) {
                    response.json(statusCodes.OK, results);
                },
                error: function (results) {
                    console.error("GET /cape/:professor_id/:course_id/:term : " + results);
                    response.json(statusCodes.INTERNAL_SERVER_ERROR);
                }
            });
        });
        
        app.get('/:professor_id/:catalog_course_id', function(request, response) {
            var sql = "select p.rmp_overall, p.name, p.rmp_helpful, p.rmp_clarity, p.rmp_easiness, p.rmp_hot, p.rmp_tid, pc.id, pc.cape_study_hrs, pc.cape_prof_gpa, pc.cape_num_evals, pc.cape_rec_prof, pc.term, pc.a_percentage, pc.b_percentage, pc.c_percentage, pc.d_percentage, pc.f_percentage, pc.p_percentage, pc.np_percentage, pc.cape_url, pc.rcmnd_class from professor as p full outer join prof_cape_info as pc on pc.professor_id = p.id where pc.professor_id = ? and pc.course_id = ?;";
            var params = [request.params.professor_id, request.params.catalog_course_id];
            request.service.mssql.query(sql, params, {
                success: function(results) {
                    var responseObj = {
                        name:results[0].name,
                        rmp_tid:results[0].rmp_tid,
                        rmp_overall:results[0].rmp_overall,
                        rmp_helpful:results[0].rmp_helpful,
                        rmp_clarity:results[0].rmp_clarity,
                        rmp_easiness:results[0].rmp_easiness,
                        rmp_hot:results[0].rmp_hot,
                        capes:[]
                    }
                    for (var i = 0; i < results.length; i++ ) {
                        responseObj.capes.push({
                            cape_id:results[i].id,
                            cape_study_hrs:results[i].cape_study_hrs, 
                            cape_prof_gpa:results[i].cape_prof_gpa,
                            cape_num_evals:results[i].cape_num_evals,
                            cape_rec_prof:results[i].cape_rec_prof,
                            term:results[i].term,
                            a_percentage:results[i].a_percentage,
                            b_percentage:results[i].b_percentage,
                            c_percentage:results[i].c_percentage,
                            d_percentage:results[i].d_percentage,
                            f_percentage:results[i].f_percentage,
                            p_percentage:results[i].p_percentage,
                            np_percentage:results[i].np_percentage,
                            cape_url:results[i].cape_url,
                            cape_rec_course:results[i].rcmnd_class});
                    }
                    response.json(statusCodes.OK, responseObj);
                },
                error: function (results) {
                    console.error("GET /cape/:professor_id/:catalog_course_id : " + results);
                    response.json(statusCodes.INTERNAL_SERVER_ERROR);
                }
            });
        });
        
        

        // UPDATE A PROFESSOR'S AND COURSE'S CAPE INFORMATION
        app.put('/:id', function (request, response) {
            var cape_study_hrs = request.body.cape_study_hrs ? "cape_study_hrs = ?" : null;
            var cape_prof_gpa = request.body.cape_prof_gpa ? "cape_prof_gpa = ?" : null;
            var cape_num_evals = request.body.cape_num_evals ? "cape_num_evals = ?" : null;
            var cape_rec_prof = request.body.cape_rec_prof ? "cape_rec_prof = ?" : null;
            var term = request.body.term ? "term = ?" : null;
            var professor_id = request.body.professor_id ? "professor_id = ?" : null;
            var course_id = request.body.course_id ? "course_id = ?" : null;
            var a_percentage = request.body.a_percentage ? "a_percentage = ?" : null;
            var b_percentage = request.body.b_percentage ? "b_percentage = ?" : null;
            var c_percentage = request.body.c_percentage ? "c_percentage = ?" : null;
            var d_percentage = request.body.d_percentage ? "d_percentage = ?" : null;
            var f_percentage = request.body.f_percentage ? "f_percentage = ?" : null;
            var p_percentage = request.body.p_percentage ? "p_percentage = ?" : null;
            var np_percentage = request.body.np_percentage ? "np_percentage = ?" : null;
            var cape_url = request.body.cape_url ? "cape_url = ?" : null;
            var rcmnd_class = request.body.rcmnd_class ? "rcmnd_class = ?" : null;

            var updates = [cape_study_hrs, cape_prof_gpa, cape_num_evals, cape_rec_prof, term, professor_id, course_id, a_percentage, b_percentage, c_percentage, d_percentage, f_percentage, p_percentage, np_percentage, cape_url, rcmnd_class].filter(function(val) {return val;}).join(', ');
            var params = [request.body.cape_study_hrs, request.body.cape_prof_gpa, request.body.cape_num_evals, request.body.cape_rec_prof, request.body.term, request.body.professor_id, request.body.course_id, request.body.a_percentage, request.body.b_percentage, request.body.c_percentage, request.body.d_percentage, request.body.f_percentage, request.body.p_percentage, request.body.np_percentage, request.body.cape_url, request.body.rcmnd_class].filter(function(val) {return val;});

            if (params.length === 0) {
                response.json(statusCodes.OK, "No changes made.");
                return;
            }
            for (var i = 0; i < params.length; i++) {
                if (params[i] === ' ')
                    params[i] = null;
            }
            params.push(request.params.id);

            var sql = "set nocount on; update prof_cape_info set " + updates + " where id = ?;";
            request.service.mssql.query(sql, params, {
                success: function(results) {
                    response.json(statusCodes.OK);
                },
                error: function (results) {
                    console.error("PUT /cape/:id : " + results);
                    response.json(statusCodes.INTERNAL_SERVER_ERROR);
                }
            });
        });
    }
