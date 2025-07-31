(function process(/*TypeResolutionEnvironment*/ env) {
    var responseObject = env.getObject();
    var resolvedTo = "MRVSStandardVariable"; // default
    
    if (responseObject && responseObject.type) {
        var fieldType = responseObject.type;
        
        if (fieldType === 'reference' || fieldType === 'glide_list' || fieldType === 'requested_for') {
            resolvedTo = "MRVSReferenceVariable";
        } else if (fieldType === 'choice' || fieldType === 'multiple_choice' || fieldType === 'numeric_scale') {
            resolvedTo = "MRVSChoiceVariable";
        } else if (fieldType === 'attachment') {
            resolvedTo = "MRVSAttachmentVariable";
        } else if (fieldType === 'container') {
            resolvedTo = "MRVSContainerVariable";
        } else {
            resolvedTo = "MRVSStandardVariable";
        }
    }
    
    return resolvedTo;
})(env);