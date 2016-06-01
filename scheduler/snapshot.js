function snapshot() {
    var snapshotTable = tables.getTable('course_snapshot_info');
    var courseTable = tables.getTable('course_section');
    courseTable.read({
        success: function(courses) {
            for (var i = 0; i < courses.length; i++) {
                var c = courses[i];
                var now = Date.now();
                var snapshot = {
                    section_id:c.section_id,
                    term_name:c.term_name,
                    term_id:c.term_id,
                    date:now,
                    seats_avail:c.sec_seats_avail,
                    seats_total:c.sec_seats_total,
                    waitlist: c.sec_waitlist,
                };
                snapshotTable.insert(snapshot); 
            }
        }
    });
}