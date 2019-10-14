const http = require("request");
const programsResult = [];
const mysqlPool = require("../../utils/mysql-con.js");
let count = 0;
let body = {
    "operationName": "DirectoryQuery",
    "variables": {
        "where": {
            "_and": [{
                "_or": [{
                    "offers_bounties": {
                        "_eq": true
                    }
                }, {
                    "external_program": {
                        "offers_rewards": {
                            "_eq": true
                        }
                    }
                }]
            }, {
                "_or": [{
                    "submission_state": {
                        "_eq": "open"
                    }
                }, {
                    "external_program": {
                        "id": {
                            "_is_null": false
                        }
                    }
                }]
            }, {
                "external_program": {
                    "id": {
                        "_is_null": true
                    }
                }
            }, {
                "_or": [{
                    "_and": [{
                        "state": {
                            "_neq": "sandboxed"
                        }
                    }, {
                        "state": {
                            "_neq": "soft_launched"
                        }
                    }]
                }, {
                    "external_program": {
                        "id": {
                            "_is_null": false
                        }
                    }
                }]
            }]
        },
        "first": 100,
        "secureOrderBy": {
            "started_accepting_at": {
                "_direction": "DESC"
            }
        },
        "cursor": "insertCursor"
    },
    "query": "query DirectoryQuery($cursor: String, $secureOrderBy: FiltersTeamFilterOrder, $where: FiltersTeamFilterInput) {\n  me {\n    edit_unclaimed_profiles\n    __typename\n  }\n  teams(first: 100, after: $cursor, secure_order_by: $secureOrderBy, where: $where) {\n    pageInfo {\n      endCursor\n      hasNextPage\n      __typename\n    }\n    edges {\n      node {\n        id\n        bookmarked\n        ...TeamTableResolvedReports\n        ...TeamTableAvatarAndTitle\n        ...TeamTableLaunchDate\n        ...TeamTableMinimumBounty\n        ...TeamTableAverageBounty\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment TeamTableResolvedReports on Team {\n  resolved_report_count\n  __typename\n}\n\nfragment TeamTableAvatarAndTitle on Team {\n  profile_picture(size: medium)\n  name\n  handle\n  submission_state\n  triage_active\n  state\n  external_program {\n    id\n    __typename\n  }\n  ...TeamLinkWithMiniProfile\n  __typename\n}\n\nfragment TeamLinkWithMiniProfile on Team {\n  handle\n  name\n  ...TeamMiniProfileTooltip\n  __typename\n}\n\nfragment TeamMiniProfileTooltip on Team {\n  profile_picture(size: small)\n  name\n  about\n  assets_in_scope: structured_scopes(archived: false, eligible_for_submission: true) {\n    total_count\n    __typename\n  }\n  currency\n  bounties_paid_last_90_days\n  reports_received_last_90_days\n  last_report_resolved_at\n  __typename\n}\n\nfragment TeamTableLaunchDate on Team {\n  started_accepting_at\n  __typename\n}\n\nfragment TeamTableMinimumBounty on Team {\n  currency\n  base_bounty\n  __typename\n}\n\nfragment TeamTableAverageBounty on Team {\n  currency\n  average_bounty_lower_amount\n  average_bounty_upper_amount\n  __typename\n}\n"
};

fetchListFromHackerOne = async function () {
    await new Promise((resolve, reject) => {
        makeHttpCall("", (cursor) => {
            if (cursor) {
                resolve("done");
                insertProgramsIntoMysql();
            }
        })
    })
    findItemsInScope(0);
}

function makeHttpCall(cursor, callback) {
    http("https://hackerone.com/graphql", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body).replace("insertCursor", cursor)
    }, (error, response, body) => {
        if (error) {
            console.log(error);
        } else {
            if (body) {
                body = JSON.parse(body);
                body.data.teams.edges.map((res, index) => {
                    let n = res.node;
                    programsResult.push([
                        n.name,
                        n.handle,
                        n.started_accepting_at,
                        n.reports_received_last_90_days,
                        n.bounties_paid_last_90_days,
                        n.average_bounty_lower_amount,
                        n.base_bounty,
                        n.average_bounty_upper_amount,
                        n.assets_in_scope.total_count,
                        n.last_report_resolved_at
                    ]);   
                })
                if (body.data.teams.pageInfo.hasNextPage) {
                    makeHttpCall(body.data.teams.pageInfo.endCursor, callback)
                } else {
                    console.log("Done Fetching Programs List from hackerone");
                    callback("done");
                }
            } else {
                console.log("Empty body while fetching list");
            }
        }
    })
}

function insertProgramsIntoMysql() {
    mysqlPool.getConnection(function (err, connection) {
        if (err) throw err;
       connection.query("INSERT IGNORE INTO hackerone(name,handle,launch_date, reports_resolved_last_90, bounties_paid_last_90, low, avg, high, in_scope, last_report_resolved) VALUES ?", [programsResult], function (error, results, fields) {
            connection.release();
            if (error) throw error;
            console.log("Insertion Into Database Successfull for all hackerone programs")
        });
    });
}

function insertScopeItemsIntoMysql(scopeData, handle) {
    mysqlPool.getConnection(function (err, connection) {
        if (err) throw err;
         connection.query('INSERT IGNORE INTO hackerone_scope(domain, handle) VALUES ?', [scopeData], function (error, results, fields) {
            connection.release();
            if (error) throw error;
            console.log("Insertion Into Database Successfull scope data for all handle "+ handle);
        });
    });
}
function findItemsInScope(index) {
    new Promise(async(resolve, reject) => {
        let result1 = await phase1Results(programsResult[index][1]);
        let result2 = await phase2Results(programsResult[index][1]);
        let finalResult = new Set(result1.concat(result2));
        let scopeData = [];
        finalResult.forEach((each) => {
            scopeData.push([each, programsResult[index][1]])
        })
        if(scopeData.length > 0){
            insertScopeItemsIntoMysql(scopeData, programsResult[index][1]);
        }
        if(index + 1 < programsResult.length){
            findItemsInScope(index+1);
        } else {
            console.log("completed all");
        }
        resolve("duccess");
    })
}

function phase1Results(handler) {
    let results = [];
    return new Promise((resolve, reject) => {
        let body = {
            "query": "query Layout_dispatcher($url_0:URI!,$first_1:Int!,$first_2:Int!,$order_by_3:UserOrderInput!,$size_4:ProfilePictureSizes!,$where_5:FiltersChecklistCheckFilterInput!,$where_6:FiltersChecklistCheckFilterInput!) {query {id,...Fx}} fragment F0 on Team {id,handle,bounty_table {low_label,medium_label,high_label,critical_label,description_html,bounty_table_rows:bounty_table_rows(first:$first_1) {edges {node {id,low,medium,high,critical,structured_scope {asset_identifier,id},updated_at},cursor},pageInfo {hasNextPage,hasPreviousPage}},updated_at,id}} fragment F1 on Credential {id} fragment F2 on Team {id} fragment F3 on Team {handle,state,credentials_set_up,claimed_credential {credentials,account_details,id,...F1},credential_instruction_html,id,...F2} fragment F4 on Team {id,handle,has_structured_policy,state} fragment F5 on ParticipantWithReputationEdge {reputation,node {_profile_picture2rz4nb:profile_picture(size:$size_4),username,url,id}} fragment F6 on Team {handle,_participantsCjg2U:participants(first:$first_2,order_by:$order_by_3) {total_count,edges {node {id},cursor,...F5},pageInfo {hasNextPage,hasPreviousPage}},id} fragment F7 on Team {handle,state,id,...F6} fragment F8 on Team {response_efficiency_percentage,response_efficiency_indicator,team_display_options {show_response_efficiency_indicator,id},id} fragment F9 on Team {bounty_table {id},offers_bounties,base_bounty,currency,id} fragment Fa on Team {participants {total_count},id} fragment Fb on Team {handle,currency,offers_bounties,average_bounty_lower_amount,average_bounty_upper_amount,top_bounty_lower_amount,top_bounty_upper_amount,formatted_total_bounties_paid_amount,resolved_report_count,bounties_paid_last_90_days,reports_received_last_90_days,last_report_resolved_at,most_recent_sla_snapshot {average_time_to_first_program_response,average_time_to_report_triage,average_time_to_bounty_awarded,average_time_to_report_resolved,id},team_display_options {show_response_efficiency_indicator,show_mean_first_response_time,show_mean_report_triage_time,show_mean_bounty_time,show_mean_resolution_time,show_top_bounties,show_average_bounty,show_total_bounties_paid,id},id,...F8,...F9,...Fa} fragment Fc on Team {handle,currency,challenge_setting {stops_at,id},checklist {checklist_checks {total_count,max_award_amount,min_award_amount},_checklist_checks2UzD5X:checklist_checks(where:$where_5) {total_count},_checklist_checks13tQmR:checklist_checks(where:$where_6) {total_count},id},id} fragment Fd on Team {handle,i_can_view_checklist_checks,id,...F7,...Fb,...Fc} fragment Fe on Team {handle,offers_bounties,i_am_a_whitelisted_reporter,id,...F0,...F3,...F4,...Fd} fragment Ff on Team {id,bookmarked} fragment Fg on Team {id,bookmarked,...Ff} fragment Fh on Team {currency,average_bounty_lower_amount,average_bounty_upper_amount,id} fragment Fi on Team {resolved_report_count,id} fragment Fj on Team {allows_private_disclosure,allows_disclosure_assistance,handle,external_url,submission_state,i_reached_abuse_limit,i_can_view_private,i_can_view_private_program_application_requirement,i_can_create_report,i_can_view_hacktivity,i_can_edit_program_profile,facebook_team,settings_link,external_program {disclosure_email,disclosure_url,id},id} fragment Fk on Team {id,name,handle,critical_submissions_enabled,submission_state} fragment Fl on Team {allowed_to_use_saml_in_sandbox,handle,has_avatar,has_payment_method,has_policy,launch_link,offers_bounties,review_requested_at,review_rejected_at,state,team_member_groups {permissions,id},id} fragment Fm on Team {id,name,i_can_view_invite_hackers,launch_link,only_cleared_hackers,i_am_a_whitelisted_reporter} fragment Fn on Team {id,handle,state,offers_bounties,...Fl,...Fm} fragment Fo on Team {id,name,about,website,handle,started_accepting_at,offers_bounties,state,offers_thanks,url,triage_active,critical_submissions_enabled,controlled_launch_team,allows_private_disclosure,submission_state,i_can_view_program_info,i_can_view_hacktivity,i_can_view_checklist_checks,i_can_subscribe_to_policy_changes,resolved_report_count,_profile_picture2rz4nb:profile_picture(size:$size_4),cover_color,cover_photo_url,has_cover_photo,has_cover_video,twitter_handle,checklist {checklist_checks {total_count},id},posts {total_count},external_program {id},_structured_scopes633GZ:structured_scopes(archived:false,eligible_for_submission:true) {total_count},...Fg,...Fh,...Fi,...Fj,...Fk,...Fn} fragment Fp on Team {handle,state,url,external_program {id},id,...Fe,...Fo} fragment Fq on Team {... @include(if:true) {id,...Fp}} fragment Fr on Node {id,__typename} fragment Fs on ResourceInterface {url,__typename,...Fq,...Fr} fragment Ft on User {has_active_ban,id} fragment Fu on User {active_ban {starts_at,ends_at,duration_in_days,id},id} fragment Fv on User {id,has_active_ban,...Ft,...Fu} fragment Fw on User {id,...Fv} fragment Fx on Query {resource:resource(url:$url_0) {__typename,...Fs,...Fr},me @include(if:true) {id,...Fw},id}",
            "variables": {
                "url_0": "teamHandler",
                "first_1": 100,
                "first_2": 5,
                "order_by_3": {
                    "field": "reputation",
                    "direction": "DESC"
                },
                "size_4": "large",
                "where_5": {
                    "state": {
                        "_eq": "completed"
                    }
                },
                "where_6": {
                    "state": {
                        "_eq": "not_claimed"
                    }
                }
            }
        }
        http("https://hackerone.com/graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body).replace("teamHandler", handler),
            timeout: 5000
        }, (error, response, body) => {
            if (error) {
                console.error("Error in phase 1 for handler " + handler + error);
            } else {
                if (body) {
                    try {
                        body = JSON.parse(body);
                        let match = body.data.query.resource.bounty_table.description_html.match(/[a-z0-9.]+.com/g);
                        if (match) {
                            results = results.concat(match);
                        }
                    } catch (e) {
                        console.error("Error in phase 1 for handler " + handler + e);
                    }
                    resolve(results);
                } else {
                    console.log("Empty body in phase 1 for handler " + handler);
                }
            }
        })
    })
}

function phase2Results(handler) {
    return new Promise((resolve, reject) => {
        let results = [];
        let body = {
            "query": "query Team_assets($first_0:Int!) {query {id,...F0}} fragment F0 on Query {team:team(handle:\"teamHandler\") {scopes:structured_scopes(first:$first_0,archived:false,eligible_for_submission:true) {edges {node {id,asset_type,asset_identifier,rendered_instruction,max_severity,eligible_for_bounty},cursor},pageInfo {hasNextPage,hasPreviousPage}},_structured_scopes1wWN6h:structured_scopes(first:$first_0,archived:false,eligible_for_submission:false) {edges {node {id,asset_type,asset_identifier,rendered_instruction},cursor},pageInfo {hasNextPage,hasPreviousPage}},id},id}",
            "variables": {
                "first_0": 500
            }
        }
        http("https://hackerone.com/graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body).replace("teamHandler", handler),
            timeout: 5000
        }, (error, response, body) => {
            if (error) {
                console.error("Error in phase 2 for handler " + handler + error);
            } else {
                if (body) {
                    body = JSON.parse(body);
                    try{
                        body.data.query.team.scopes.edges.map((res) => {
                            let match1 = res.node.asset_identifier.match(/.com|.co|www/g)
                            let match2 = res.node.rendered_instruction.match(/[a-z0-9.]+.com+/g)
                            if (match1) {
                                results.push(res.node.asset_identifier);
                            } else if (match2) {
                                results = results.concat(match2);
                            }
                        })
                    }catch(e){
                        console.error("Error in phase 2 for handler " + handler + e);
                    }
                    resolve(results);
                } else {
                    console.log("Empty body in phase 2 for handler " + handler);
                }
            }
        })
    })
}
module.exports = fetchListFromHackerOne;