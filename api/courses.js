// INSERT A NEW COURSE INTO COURSE TABLE
exports.post = function(request, response) {
    var sql = "DECLARE @table table (id nvarchar(255)); set nocount on; insert into course (catalog_course_id, term_id, course_name, course_id, description, prereqs, units) OUTPUT inserted.id into @table values (?, ?, ?, ?, ?, ?, ?); select id from @table;";
    var params = [request.body.catalog_course_id, request.body.term_id, request.body.course_name, request.body.course_id, request.body.description, request.body.prereqs, request.body.units];
    request.service.mssql.query(sql, params, {
        success: function(results) {
            response.json(statusCodes.OK, results);
        },
        error: function (results) {
            console.error("POST /courses error: " + results);
            response.json(statusCodes.INTERNAL_SERVER_ERROR);
        }
    });
};


exports.register = 
    function(app)
    {
        
        app.get('/:term_id', function (request, response) {
                var sql = "set nocount on; select t.id, t.description, t.units, t.prereqs, t.course_name, t.seats_avail, t.seats_total, t.waitlist, t.course_id, t.workload, t.avg_gpa from course as t where t.term_id = ?;";
    //var params = [request.body.catalog_course_id, request.body.term_id, request.body.avg_gpa, request.body.course_name, request.body.course_id, request.body.description, request.body.prereqs, request.body.units];
    request.service.mssql.query(sql, request.params.term_id, {
        success: function(results) {
            response.json(statusCodes.OK, results);
        },
        error: function (results) {
            console.error("GET /courses error: " + results);
            response.json(statusCodes.INTERNAL_SERVER_ERROR);
        }
    });
        });
            
        // GET INFO FROM FRONT END
        app.get('/specific/:course_id', function(request, response) {
            /*var courseSnapshotsql = "set nocount on; 
            select c.id, c.catalog_course_id, c.avg_gpa, c.seats_avail, c.seats_total, c.course_name, c.course_id, c.description, c.prereqs, c.units, c.waitlist, course_section.section_id, course_section.id as sectionid, course_section.section_name, course_section.type as section_type, course_section.section_days, course_section.section_start_time, course_section.section_end_time, course_section.location, course_section.sec_seats_avail, course_section.sec_seats_total, course_section.sec_waitlist, course_section_exams.exam_type, course_section_exams.exam_start_time, course_section_exams.exam_end_time, course_section_exams.exam_location, course_section_exams.exam_date, course_section_exams.id as examid, course_section_discussions.id as discid, course_section_discussions.type as disc_type, course_section_discussions.disc_days, course_section_discussions.disc_start_time, course_section_discussions.disc_end_time, course_section_discussions.disc_location, course_section_discussions.disc_id, course_section_discussions.disc_name, course_section_discussions.disc_seats_avail, course_section_discussions.disc_seats_total, course_section_discussions.disc_waitlist, professor.name, professor.rmp_overall, professor.rmp_helpful, professor.rmp_clarity, professor.rmp_easiness, professor.rmp_hot, prof_cape_info.id as capeid, prof_cape_info.term as cape_term, prof_cape_info.cape_study_hrs, prof_cape_info.cape_prof_gpa, prof_cape_info.cape_num_evals, prof_cape_info.cape_rec_prof, 
                
                course_snapshot_info.id as snapshot_id, 
                    course_snapshot.waitlist as snapshot_waitlist, 
                        course_snapshot_info.term_id as snapshot_term, 
                            course_snapshot_info.seats_avail as snapshot_seats_avail, 
                                course_snapshot_info.seats_total as snapshot_seats_total, 
                                    course_snapshot_info.date as snapshot_date 
            
            from course as c 
            
            full outer join course_section on c.id = course_section.course_id  
            full outer join course_section_exams on course_section_exams.section_id = course_section.id 
            full outer join course_section_discussions on course_section_discussions.section_id = course_section.id 
            full outer join professor on professor.id = course_section.professor_id 
            full outer join course_snapshot_info on course_section.id = course_snapshot_info.section_id 
            full outer join prof_cape_info on prof_cape_info.course_id = c.catalog_course_id and prof_cape_info.professor_id = professor.id where c.id = ? 
                
                order by course_section.section_name, course_section_exams.exam_date;";  */
            
            var sql = "set nocount on; select c.id, c.catalog_course_id, c.avg_gpa, c.seats_avail, c.seats_total, c.course_name, c.course_id, c.description, c.prereqs, c.units, c.waitlist, course_section.section_id, course_section.id as sectionid, course_section.section_name, course_section.type as section_type, course_section.section_days, course_section.section_start_time, course_section.section_end_time, course_section.location, course_section.sec_seats_avail, course_section.sec_seats_total, course_section.sec_waitlist, course_section_exams.exam_type, course_section_exams.exam_start_time, course_section_exams.exam_end_time, course_section_exams.exam_location, course_section_exams.exam_date, course_section_exams.id as examid, course_section_discussions.id as discid, course_section_discussions.type as disc_type, course_section_discussions.disc_days, course_section_discussions.disc_start_time, course_section_discussions.disc_end_time, course_section_discussions.disc_location, course_section_discussions.disc_id, course_section_discussions.disc_name, course_section_discussions.disc_seats_avail, course_section_discussions.disc_seats_total, course_section_discussions.disc_waitlist, professor.name, professor.rmp_tid, professor.rmp_overall, professor.rmp_helpful, professor.rmp_clarity, professor.rmp_easiness, professor.rmp_hot, prof_cape_info.id as capeid, prof_cape_info.term as cape_term, prof_cape_info.cape_study_hrs, prof_cape_info.cape_prof_gpa, prof_cape_info.cape_num_evals, prof_cape_info.cape_rec_prof, prof_cape_info.a_percentage, prof_cape_info.b_percentage, prof_cape_info.c_percentage, prof_cape_info.d_percentage, prof_cape_info.f_percentage, prof_cape_info.p_percentage, prof_cape_info.np_percentage, prof_cape_info.cape_url, prof_cape_info.rcmnd_class from course as c full outer join course_section on c.id = course_section.course_id full outer join course_section_exams on course_section_exams.section_id = course_section.id full outer join course_section_discussions on course_section_discussions.section_id = course_section.id full outer join professor on professor.id = course_section.professor_id full outer join prof_cape_info on prof_cape_info.course_id = c.catalog_course_id and prof_cape_info.professor_id = professor.id where c.id = ? order by course_section.section_name, course_section_exams.exam_date, course_section_discussions.type;";
                
            request.service.mssql.query(sql, request.params.course_id, {
                success: function(results) {
                    var responseObj = {
                        course_name:results[0].course_name,
                        course_id:results[0].course_id,
                        description:results[0].description,
                        prereqs:results[0].prereqs,
                        units:results[0].units,
                        seats_avail:results[0].seats_avail,
                        seats_total:results[0].seats_total,
                        waitlist:results[0].waitlist,
                        avg_gpa:results[0].avg_gpa,
                        course_sections:[],
                    };
                    var section = [];
                    var discussion = [];
                    var exam = [];
                    var cape_info = [];
                    var enrollment_history = [];
                    for (var i = 0; i < results.length; i++) {
                        var section_loc = section.indexOf(results[i].sectionid);
                        var r = results[i];
                        //if section is already there
                        if (section_loc > -1) {
                            // if discussion is not already there
                            if (discussion.indexOf(results[i].discid) <= -1 && (r.disc_type != null || r.disc_days != null || r.disc_start_time != null || r.disc_end_time != null || r.disc_location != null || r.disc_id != null || r.disc_name != null || r.disc_seats_avail != null || r.disc_seats_total != null || r.disc_waitlist != null )) {
                                discussion.push(results[i].discid);
                                var discObj = {
                                    disc_type:results[i].disc_type,
                                    disc_days:results[i].disc_days,
                                    disc_start_time:results[i].disc_start_time, 
                                    disc_end_time:results[i].disc_end_time,
                                    disc_location:results[i].disc_location,
                                    disc_id:results[i].disc_id,
                                    disc_name:results[i].disc_name,
                                    disc_seats_avail:results[i].disc_seats_avail,
                                    disc_seats_total:results[i].disc_seats_total,
                                    disc_waitlist:results[i].disc_waitlist
                                }
                                responseObj.course_sections[section_loc].discussions.push(discObj);
                            }
                            if (exam.indexOf(results[i].examid) <= -1 && (r.exam_type || r.exam_start_time || r.exam_end_time || r.exam_location || r.exam_date)) {
                                exam.push(results[i].examid);
                                var examObj = {
                                    exam_type:results[i].exam_type,
                                    exam_start_time:results[i].exam_start_time,
                                    exam_end_time:results[i].exam_end_time,
                                    exam_location:results[i].exam_location,
                                    exam_date:results[i].exam_date
                                }
                                responseObj.course_sections[section_loc].exams.push(examObj);
                            }
                            if (cape_info.indexOf(results[i].capeid) <= -1 && (r.cape_term || r.cape_study_hrs || r.cape_prof_gpa || r.cape_num_evals || r.cape_rec_prof)) {
                                cape_info.push(results[i].capeid);
                                var capeObj = {
                                    term:results[i].cape_term,
                                    cape_id:results[i].capeid,
                                    cape_study_hrs:results[i].cape_study_hrs,
                                    cape_prof_gpa:results[i].cape_prof_gpa,
                                    cape_num_evals:results[i].cape_num_evals,
                                    cape_rec_prof:results[i].cape_rec_prof,
                                    a_percentage: results[i].a_percentage,
                                    b_percentage: results[i].b_percentage,
                                    c_percentage: results[i].c_percentage,
                                    d_percentage: results[i].d_percentage,
                                    f_percentage: results[i].f_percentage,
                                    p_percentage: results[i].p_percentage,
                                    np_percentage: results[i].np_percentage,
                                    cape_url: results[i].cape_url,
                                    cape_rec_course: results[i].rcmnd_class
                                }
                                responseObj.course_sections[section_loc].cape_info.push(capeObj);
                            }
                            if (enrollment_history.indexOf(results[i].snapshot_id) <= -1 && (r.snapshot_date || r.snapshot_seats_total || r.snapshot_seats_avail || r.snapshot_term || r.snapshot_waitlist)) {
                                enrollment_history.psuh(results[i].snapshot_id);
                                var snapshotObj = {
                                    date:results[i].snapshot_date,
                                    seats_avail:results[i].snapshot_seats_avail,
                                    seats_total:results[i].snapshot_seats_total,
                                    term:results[i].snapshot_term,
                                    waitlist:results[i].snapshot_waitlist,
                                }
                                responseObj.course_sections[section_loc].enrollment_history.push(snapshotObj);
                            }
                        }
                        else {
                            section.push(results[i].sectionid);
                            var sectionObj = {
                                section_id:results[i].section_id,
                                section_name:results[i].section_name,
                                section_type:results[i].section_type,
                                section_days:results[i].section_days,
                                section_start_time:results[i].section_start_time,
                                section_end_time:results[i].section_end_time,
                                location:results[i].location,
                                section_seats_avail:results[i].sec_seats_avail,
                                section_seats_total:results[i].sec_seats_total,
                                section_waitlist:results[i].sec_waitlist,
                                exams:[],
                                discussions:[],
                                professor_name:results[i].name,
                                rmp_tid:results[i].rmp_tid,
                                rmp_overall:results[i].rmp_overall,
                                rmp_helpful:results[i].rmp_helpful,
                                rmp_clarity:results[i].rmp_clarity,
                                rmp_easiness:results[i].rmp_easiness,
                                rmp_hot:results[i].rmp_hot,
                                cape_info:[], 
                                enrollment_history:[],
                            };
                            exam.push(results[i].examid);
                            var examObj = {
                                exam_type:results[i].exam_type,
                                exam_start_time:results[i].exam_start_time,
                                exam_end_time:results[i].exam_end_time,
                                exam_location:results[i].exam_location,
                                exam_date:results[i].exam_date
                            };
                            discussion.push(results[i].discid);
                            var discObj = {
                                disc_type:results[i].disc_type,
                                disc_days:results[i].disc_days,
                                disc_start_time:results[i].disc_start_time,
                                disc_end_time:results[i].disc_end_time,
                                disc_location:results[i].disc_location,
                                disc_id:results[i].disc_id,
                                disc_name:results[i].disc_name,
                                disc_seats_avail:results[i].disc_seats_avail,
                                disc_seats_total:results[i].disc_seats_total,
                                disc_waitlist:results[i].disc_waitlist
                            }
                            cape_info.push(results[i].capeid);
                            var capeObj = {
                                term:results[i].cape_term,
                                cape_id:results[i].capeid,
                                cape_study_hrs:results[i].cape_study_hrs,
                                cape_prof_gpa:results[i].cape_prof_gpa,
                                cape_num_evals:results[i].cape_num_evals,
                                cape_rec_prof:results[i].cape_rec_prof,
                                a_percentage: results[i].a_percentage,
                                b_percentage: results[i].b_percentage,
                                c_percentage: results[i].c_percentage,
                                d_percentage: results[i].d_percentage,
                                f_percentage: results[i].f_percentage,
                                p_percentage: results[i].p_percentage,
                                np_percentage: results[i].np_percentage,
                                cape_url: results[i].cape_url,
                                cape_rec_course: results[i].rcmnd_class
                            }
                            enrollment_history.push(results[i].snapshot_id)
                            var snapshotObj = {
                                date:results[i].snapshot_date,
                                seats_avail:results[i].snapshot_seats_avail,
                                seats_total:results[i].snapshot_seats_total,
                                term:results[i].snapshot_term,
                                waitlist:results[i].snapshot_waitlist,
                            }
                            if (r.exam_type || r.exam_start_time || r.exam_end_time || r.exam_location || r.exam_date)
                            sectionObj.exams.push(examObj);
                            if (r.disc_type != null || r.disc_days != null || r.disc_start_time != null || r.disc_end_time != null || r.disc_location != null || r.disc_id != null || r.disc_name != null || r.disc_seats_avail != null || r.disc_seats_total != null || r.disc_waitlist != null)
                            sectionObj.discussions.push(discObj);
                            if (r.cape_term || r.cape_study_hrs || r.cape_prof_gpa || r.cape_num_evals || r.cape_rec_prof)
                            sectionObj.cape_info.push(capeObj);
                            if (r.snapshot_date || r.snapshot_seats_total || r.snapshot_seats_avail || r.snapshot_term || r.snapshot_waitlist)
                            sectionObj.enrollment_history.push(snapshotObj);
                            responseObj.course_sections.push(sectionObj);
                        }
                    }
                    response.json(statusCodes.OK, responseObj);
                },
                error: function (results) {
                    console.error("GET /specific/:course_id : " + results);
                    response.json(statusCodes.INTERNAL_SERVER_ERROR);
                }
            });
        });
        
        app.get('/specific/:catalog_course_id/:term_id', function(request, response) {
            var sql = "set nocount on; select c.id from course as c where c.catalog_course_id = ? and c.term_id = ?;";
            var params = [request.params.catalog_course_id, request.params.term_id];
            request.service.mssql.query(sql, params, {
                success: function(results) {
                    response.json(statusCodes.OK, results);
                },
                error: function(results) {
                    console.error("GET /courses/specific/:catalog_course_id/:term_id " + results);
                    response.json(statusCodes.INTERNAL_SERVER_ERROR);
                }
            });
        });
        
        
        // UPDATE A COURSES'S INFORMATION
        app.put('/:id', function (request, response) {
            var catalog_course_id = request.body.catalog_course_id ? "catalog_course_id = ?" : null;
            var term_id = request.body.term_id ? "term_id = ?" : null;
            var avg_gpa = request.body.avg_gpa ? "avg_gpa = ?" : null;
            var course_name = request.body.course_name ? "course_name = ?" : null;
            var course_id = request.body.course_id ? "course_id = ?" : null;
            var description = request.body.description ? "description = ?" : null;
            var prereqs = request.body.prereqs ? "prereqs = ?" : null;
            var units = request.body.units ? "units = ?" : null;
            var updates = [catalog_course_id, term_id, avg_gpa, course_name, course_id, description, prereqs, units].filter(function(val) {return val;}).join(', ');
            var params = [request.body.catalog_course_id, request.body.term_id, request.body.avg_gpa, request.body.course_name, request.body.course_id, request.body.description, request.body.prereqs, request.body.units].filter(function(val) {return val;});
            if (params.length == 0) {
                response.json(statusCodes.OK, "No changes made.");
                return;
            }
            
            var sql= "update course set " + updates + " where course.id = ?;";
            console.log(sql);
            request.service.mssql.query(sql, request.params.id, {
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