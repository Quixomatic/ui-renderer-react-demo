export const searchQuerySchema = `query nowAgentAssist(
  $tableConfig: String!
  $formTable: String
  $formSysID: String
  $context: String!
  $query: String!
  $hints: String
) {
  GlideContextualSearch_Query(
    tableConfig: $tableConfig
    formTable: $formTable
    formSysID: $formSysID
    context: $context
    query: $query
    hints: $hints
  ) {
    request {
      query {
        freetext
      }
      meta {
        window {
          start
          end
        }
      }
      context
      id
    }
    results {
      id
      title
      link
      linkTarget
      snippet
      relatedLinks {
        link
        title
        spLink
      }
      ... on GlideContextualSearch_CatalogItemType {
        image {
          link
          thumbnail {
            link
          }
        }
      }
      meta {
        score
        source
        interleaved
        card_icon
        card_label
        card_title
        additional_fields
        card_snippet
        card_show_footer
        detail_component_name
        detail_title
        detail_link
        detail_additional_fields
        detail_show_work_note
        ... on GlideContextualSearch_CatalogItemMetaType {
          description
        }
        ... on GlideContextualSearch_KnowledgeArticleMetaType {
          author
          link
          number
          published
          modified
          modified_display
          viewCount
        }
        ... on GlideContextualSearch_PinnedArticleMetaType {
          pinned
          author
          link
          number
          published
          modified
          modified_display
          viewCount
        }
        ... on GlideContextualSearch_SocialQAMetaType {
          author
          published
          modified
          modified_display
          viewCount
          answerCount
          votes
        }
        ... on GlideContextualSearch_CommunityBlogMetaType {
          forum
          views
          upvotes
          helpful
          likes
          rating
          modified
          modified_display
          full_view_url
          comments
        }
        ... on GlideContextualSearch_CommunityQuestionMetaType {
          forum
          views
          upvotes
          helpful
          likes
          rating
          modified
          modified_display
          full_view_url
          comments
        }
        ... on GlideContextualSearch_CommunityAnswerMetaType {
          forum
          views
          upvotes
          helpful
          likes
          rating
          modified
          modified_display
          full_view_url
          comments
        }
        ... on GlideContextualSearch_GlideResourceSearchMetaType {
          table_name
          resource_details
          description
        }
        ... on GlideContextualSearch_ScriptResourceSearchMetaType {
          confidence
          resource_details
          table_name
          recommendation_type
          recommendation_title
          recommendation_message
          recommendation_action
          recommendation_result
          recommendation_common_field
        }
      }
    }
    meta {
      has_more_results
      returned_results
      recorded_actions {
        relevance
        search_term
        relevant_doc_table
        relevant_doc
      }
    }
  }
}`;
