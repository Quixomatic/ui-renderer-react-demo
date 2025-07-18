export const listImportQuery = `query($trackerName: String!) {
    GlideListImport_Query {
        rootTrackerId: getRootExecutionTracker(trackerName: $trackerName)
    }
}`;

export const listPreviewQuery = `query($importSetId: String!) {
    GlideListImport_Query {
        result: getPreviewTableDetails(importSetId: $importSetId) {
                tableName,
                columns,
                numErrorRows
        }
    }
}`;
