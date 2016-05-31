var pie = new d3pie("grade-dist-chart", {
    "header": {
        "title": {
            "fontSize": 41,
            "font": "open sans"
        },
        "subtitle": {
            "color": "#999999",
            "fontSize": 12,
            "font": "open sans"
        },
        "titleSubtitlePadding": 9
    },
    "footer": {
        "color": "#999999",
        "fontSize": 10,
        "font": "open sans",
        "location": "bottom-left"
    },
    "size": {
        "canvasHeight": 250,
        "canvasWidth": 250,
        "pieOuterRadius": "90%"
    },
    "data": {
        "sortOrder": "value-desc",
        "content": [
            {
                "label": "A",
                "value": 85002,
                "color": "#F38630"
            },
            {
                "label": "B",
                "value": 78327,
                "color": "#69D2E7"
            },
            {
                "label": "C",
                "value": 67706,
                "color": "#FA6900"
            },
            {
                "label": "D",
                "value": 36344,
                "color": "#A7DBD8"
            },
            {
                "label": "F",
                "value": 32170,
                "color": "#E0E4CC"
            }
        ]
    },
    "labels": {
        "outer": {
            "pieDistance": 32
        },
        "inner": {
            "hideWhenLessThanPercentage": 3
        },
        "mainLabel": {
            "fontSize": 11
        },
        "percentage": {
            "color": "#000000",
            "decimalPlaces": 0
        },
        "value": {
            "color": "#adadad",
            "fontSize": 11
        },
        "lines": {
            "enabled": true
        },
        "truncation": {
            "enabled": true
        }
    },
    "effects": {
        "pullOutSegmentOnClick": {
            "effect": "none",
            "speed": 400,
            "size": 8
        }
    },
    "misc": {
        "gradient": {
            "enabled": false,
            "percentage": 100
        }
    },
    "callbacks": {}
});