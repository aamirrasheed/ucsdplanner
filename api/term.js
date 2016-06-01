// INSERT A NEW TERM
exports.post = function(request, response) {
    var quarter = request.body.quarter ? request.body.quarter : null;
    var term_name = request.body.term_name ? request.body.term_name : null;
    var year = request.body.year ? request.body.year : null;

    if (quarter == null || term_name == null || year == null) {
        response.json(statusCodes.INTERNAL_SERVER_ERROR, "Must specify term_name, quarter, and year when inserting term");
    }
    var sql = "DECLARE @table table (id nvarchar(255)); set nocount on; insert into term (quarter, year, term_name) OUTPUT inserted.id into @table values (?, ?, ?); select id from @table;";
    var params = [quarter, year, term_name];
    request.service.mssql.query(sql, params, {
        success: function(results) {
            response.json(statusCodes.OK, results);
        },
        error: function (results) {
            console.error("POST /term error: " + results);
            response.json(statusCodes.INTERNAL_SERVER_ERROR);
        }
    });
};


// GET LIST OF ALL TERMS
exports.get = function(request, response) {
    var sql = "set nocount on; select t.id as term_id, t.quarter as quarter, t.year as year, t.term_name as term_name from term as t order by t.term_name;";
    request.service.mssql.query(sql, {
        success: function(results) {
            response.json(statusCodes.OK, results);
        },
        error: function (results) {
            console.error("GET /term error: " + results);
            response.json(statusCodes.INTERNAL_SERVER_ERROR);
        }
    });
};

exports.register =
    function(app)
    {
        // INSERT TERM IF ENTRY DOES NOT ALREADY EXIST, UPDATE OTHERWISE
        app.post('/update', function(request, response) {
            var quarter = request.body.quarter ? "quarter = ?" : null;
            var term_name = request.body.term_name ? "term_name = ?" : null;
            var year = request.body.year ? "year = ?" : null;

            if (quarter == null || term_name == null || year == null) {
                response.json(statusCodes.INTERNAL_SERVER_ERROR, "Must specify term_name, quarter, and year when inserting term");
            }

            var sql = "set nocount on; select term.id from term where term.term_name = ?;";

            request.service.mssql.query(sql, request.body.term_name, {

                success: function(results) {

                    // IF ENTRY DOES NOT EXIST, CREATE ENTRY
                     if (results.length === 0) {
                        var sql_insert = "DECLARE @table table (id nvarchar(255)); set nocount on; insert into term (quarter, year, term_name) OUTPUT inserted.id into @table values (?, ?, ?); select id from @table;";

                        var params = [request.body.quarter, request.body.year, request.body.term_name];
                        request.service.mssql.query(sql_insert, params, {
                            success: function(results) {
                                response.json(statusCodes.OK, results);
                            },
                            error: function (results) {
                                console.error("POST /term error: " + results);
                                response.json(statusCodes.INTERNAL_SERVER_ERROR);
                            }
                        });
                    }

                    // IF ENTRY DOES EXIST, UPDATE ENTRY
                    else {
                        var updates = [quarter, year, term_name].filter(function(val) {return val;}).join(', ');
                        var params = [request.body.quarter, request.body.year, request.body.term_name].filter(function(val) {return val;});

                        if (params.length === 0) {
                            response.json(statusCodes.OK, "No changes made.");
                            return;
                        }

                        for (var i = 0; i < params.length; i++) {
                            if (params[i] === ' ')
                                params[i] = null;
                        }

                        params.push(results[0].id);

                        var sql = "set nocount on; update term set " + updates + " where id = ?;";

                        request.service.mssql.query(sql, params, {
                            success: function(results) {
                                response.json(statusCodes.OK);
                            },
                            error: function (results) {
                                console.error("PUT /term/:id : " + results);
                                response.json(statusCodes.INTERNAL_SERVER_ERROR);
                            }
                        });
                    }

                },

                error: function(results) {
                    console.error("GET /term/:name : " + results);
                    response.json(statusCodes.INTERNAL_SERVER_ERROR);
                }
            })
        });

        // GET A TERM ID FROM A TERM NAME PARAM
        app.get('/:term_name', function (request, response) {
            var sql = "set nocount on; select term.id from term where term.term_name = ?;";
            request.service.mssql.query(sql, request.params.term_name, {
                success: function(results) {
                    response.json(statusCodes.OK, results);
                },
                error: function (results) {
                    console.error("GET /term/id error: " + results);
                    response.json(statusCodes.INTERNAL_SERVER_ERROR);
                }
            });
        });

        // UPDATE A TERM'S INFORMATION
        app.put('/:id', function (request, response) {
            var quarter = request.body.quarter ? "quarter = ?" : null;
            var year = request.body.year ? "year = ?" : null;
            var term_name = request.body.term_name ? "term_name = ?" : null;
            var updates = [quarter, year, term_name].filter(function(val) {return val;}).join(', ');
            var params = [request.body.quarter, request.body.year, request.body.term_name].filter(function(val) {return val;});
            if (params.length === 0) {
                response.json(statusCodes.OK, "No changes made.");
                return;
            }
            for (var i = 0; i < params.length; i++) {
                if (params[i] === ' ')
                    params[i] = null;
            }
            params.push(request.params.id);

            var sql = "set nocount on; update term set " + updates + " where id = ?;";
            request.service.mssql.query(sql, params, {
                success: function(results) {
                    response.json(statusCodes.OK);
                },
                error: function (results) {
                    console.error("PUT /term/:id : " + results);
                    response.json(statusCodes.INTERNAL_SERVER_ERROR);
                }
            });
        });
    };
