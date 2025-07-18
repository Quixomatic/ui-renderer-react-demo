export const TAG_PREFIX_GET_QUERY = `query($prefix: String!) {
    GlideViewableTagQuery_Query {
        viewableUserTags(prefix: $prefix) {
            records {
                name
                sysId
                viewableBy
            }
        }
    }
}`;

export const TAG_CREATE = `mutation($text: String!) {
    GlideRecord_Mutation {
        insert_label(name: $text) {
            sys_id {
                value 
            }
        }
    }
}`;
