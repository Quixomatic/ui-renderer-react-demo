export const EDIT_TAG_MODAL_QUERIES = {
	GET_TAG_DETAILS: `
        query ($tagId: String!) {
            GlideRecord_Query {
                label(sys_id: $tagId) {
                    _results {
                        sysId: sys_id {
                            value
                        }
                        name {
                        value
                        canWrite
                        }
                        viewableBy: viewable_by {
                            value
                        }
                        userList: user_list {
                            value
                            displayValue
                        }
                        groupList: group_list {
                            value
                            displayValue
                        }
                        owner {
                            value
                            displayValue
                        }
                        _query {
                            queryWithSysId: GlideRecord_Query {
                                sys_user(queryConditions: "sys_idIN$$parent.user_list$$", pagination: {limit: 20}) {
                                    _results {
                                        sysId: sys_id {
                                            value
                                        }
                                        avatar {
                                            value
                                        }
                                    }
                                    _rowCount
                                }
                            }
                        }
                    }
                }
            }
        }
    `,
	GET_USERS: `
        query($queryConditions: String!) {
            GlideRecord_Query {
                sys_user(queryConditions: $queryConditions, pagination: { limit: 10}) {
                    _results {
                        name { value }
                        sysId:  sys_id { value }
                        email { value }
                        avatar { value }
                    }
                    _rowCount
                }
            }
        }
    `,
	GET_USER_GROUPS: `
        query($queryConditions: String!) {
            GlideRecord_Query {
                sys_user_group(queryConditions: $queryConditions, pagination: { limit: 10}) {
                    _results {
                        name { value }
                        sysId: sys_id { value }
                    }
                    _rowCount
                }
            }
        }
    `,
	UPDATE_TAG: `
        mutation ($sysId: String!, $name: String!, $userList: String, $groupList: String, $viewableBy: String!) {
            GlideRecord_Mutation {
                update_label(
                    sys_id: $sysId
                    name: $name,
                    user_list: $userList,
                    group_list: $groupList
                    viewable_by: $viewableBy
                ) {
                    name { value }
                    ViewableBy: viewable_by { value }
                }
            }
        }
    `
};
