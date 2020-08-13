var HTTPS = require("https");

var botID = "";
var token = "";

function respond() {
    var request = JSON.parse(this.req.chunks[0]),
        botRegex = /^\/all/;

    if (request.text && botRegex.test(request.text)) {
        this.res.writeHead(200);
        var groupId = request.group_id;
        getAllMembersStringPromise(groupId);
        this.res.end();
    } else {
        console.log("don't care");
        this.res.writeHead(200);
        this.res.end();
    }
}

function postMessage(user_ids, memberNames, memList) {
    var options, body, botReq;

    options = {
        hostname: "api.groupme.com",
        path: "/v3/bots/post",
        method: "POST",
    };

    body = {
        bot_id: botID,
        text: memberNames,
        attachments: [{ loci: [], type: "mentions", user_ids: [] }],
    };

    var index = 0;
    for (var i = 0; i < user_ids.length; i++) {
        body.attachments[0].loci.push([index, memList[i].length + 1]);

        body.attachments[0].user_ids.push(user_ids[i]);
        index = memList[i].length + 2;
    }

    console.log("sending @all to " + botID);

    botReq = HTTPS.request(options, function(res) {
        if (res.statusCode == 202) {
            //neat
        } else {
            console.log("rejecting bad status code " + res.statusCode);
        }
    });

    botReq.on("error", function(err) {
        console.log("error posting message " + JSON.stringify(err));
    });
    botReq.on("timeout", function(err) {
        console.log("timeout posting message " + JSON.stringify(err));
    });
    botReq.end(JSON.stringify(body));
}

function getAllMembersStringPromise(groupId) {
    options = {
        hostname: "api.groupme.com",
        path: "/v3/groups?token=" + token,
    };

    var memReq = HTTPS.request(options, function(res) {
        // Push the fragmented data onto data
        var body = "";
        res.on("data", function(resData) {
            body += resData;
        });

        res.on("end", () => {
            groups = JSON.parse(body);

            var group = groups.response.filter((g) => {
                return g.id == groupId;
            });
            console.log("HELLO");
            console.log(group[0]);

            members = group[0].members;
            console.log(members);
            var ids = [];
            var memberNames = [];
            for (var member of members) {
                ids.push(member.user_id);
                memberNames.push(member.nickname);
            }
            console.log(ids);

            postMessage(ids, "@" + memberNames.join(" @"), memberNames);
        });
    });

    body = {
        token: token,
    };
    memReq.end(JSON.stringify(body));
    // console.log(memReq);
}
exports.respond = respond;