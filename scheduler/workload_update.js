function workload_update() {
    var capeTable = tables.getTable('prof_cape_info');
    var courses = [];
    var course_workload = [];
    var numHits = [];
    console.log("YOOO");
    capeTable.read({
        success:function(cape) {
            for (var i = 0; i< cape.length; i++) {
                var c = cape[i];
                var loc = courses.indexOf(c.course_id);
                if (loc < 0) {
                    if (c.cape_study_hrs >= 0) {
                        courses.push(c.course_id);
                        course_workload.push(c.cape_study_hrs);
                        numHits.push(c.cape_num_evals);
                    }
                }
                else {
                    if (c.cape_study_hrs >= 0) {
                        course_workload[loc] = (numHits[loc]*course_workload[loc] + c.cape_study_hrs * c.cape_num_evals)/(c.cape_num_evals + numHits[loc]);
                        numHits[loc] += c.cape_num_evals;
                    }
                }
            }
            
            var insert = "";
            // courses.length
            for (var j = 0; j < courses.length; j++) {
                insert += " when course.catalog_course_id = '" + String(courses[j]) + "' then " + String(Math.round(course_workload[j])) + " ";
            }
            var sql = "update course set course.workload = case "+ insert + " end where course.catalog_course_id in ('" + courses.join("', '") + "');";
            console.log(sql);
                 mssql.query(sql,  {
                    success:function(results) {
                                    console.log("DONE");
                    },
                    error: function(results) {
                        console.error(results);
                    }
                });
        }
    });
}
