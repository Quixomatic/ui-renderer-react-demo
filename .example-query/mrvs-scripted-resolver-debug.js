(function process(/*ResolverEnvironment*/ env) {
    try {
        var arguments = env.getArguments();
        var variableSetId = arguments.variableSetId;
        
        // Get the variable set
        var vsGr = new GlideRecord('item_option_new_set');
        if (!vsGr.get(variableSetId)) {
            throw new Error('Variable set not found: ' + variableSetId);
        }

        var response = {
            variableSetId: variableSetId,
            variableSetName: vsGr.internal_name.toString(),
            maxRows: parseInt(vsGr.max_rows) || 50,
            variablesLayout: [],
            variables: [],
            clientScripts: {
                onChange: [],
                onLoad: [],
                onSubmit: []
            },
            uiPolicies: []
        };

        // Add variables query with debugging
        var varGr = new GlideRecord('item_option_new');
        varGr.addQuery('variable_set', variableSetId);
        varGr.addActiveQuery();
        varGr.orderBy('order');
        varGr.query();

        while (varGr.next()) {
            var fieldName = 'variables.' + vsGr.internal_name + '.' + varGr.name;
            var fieldType = _mapFieldType(varGr.type.toString());

            // Add to layout
            response.variablesLayout.push({
                name: fieldName,
                type: 'field',
                parent: ''
            });

            // Build field object with debugging
            var fieldObj = {
                type: fieldType,
                id: varGr.sys_id.toString(),
                name: fieldName,
                variableName: varGr.name.toString(),
                label: varGr.question_text.toString(),
                order: parseInt(varGr.order) || 0,
                mandatory: varGr.mandatory == true,
                readOnly: varGr.read_only == true,
                visible: varGr.visible_on_bundles == true,
                canRead: true,
                canWrite: !varGr.read_only,
                canCreate: true,
                variableAttributes: '',
                defaultValue: '',
                value: '',
                displayValue: '',
                exampleText: '',
                helpText: '',
                regExp: '',
                __typename: _getTypeName(fieldType)
            };

            // Debug logging
            gs.info('Building field: ' + fieldName + ', type: ' + fieldType + ', typename: ' + _getTypeName(fieldType));
            
            response.variables.push(fieldObj);
        }

        return response;

    } catch (error) {
        gs.error('MRVS GraphQL Error: ' + error.message);
        throw error;
    }

    // Helper function to map numeric types to string types
    function _mapFieldType(numericType) {
        var typeMap = {
            '1': 'boolean',
            '2': 'break', 
            '3': 'multiple_choice',
            '4': 'numeric_scale',
            '5': 'choice',
            '6': 'string',
            '7': 'text',
            '8': 'reference',
            '9': 'glide_date',
            '10': 'glide_date_time',
            '11': 'html',
            '12': 'url',
            '13': 'email',
            '14': 'ip_address',
            '15': 'masked',
            '16': 'glide_duration',
            '17': 'attachment',
            '18': 'glide_list',
            '19': 'label',
            '20': 'rich_text_label',
            '21': 'wide_text',
            '22': 'multi_line_text'
        };
        return typeMap[numericType] || 'string';
    }

    // Helper to get GraphQL typename
    function _getTypeName(fieldType) {
        if (fieldType === 'reference' || fieldType === 'glide_list') {
            return 'MRVSReferenceVariable';
        } else if (fieldType === 'choice' || fieldType === 'multiple_choice') {
            return 'MRVSChoiceVariable';
        } else if (fieldType === 'attachment') {
            return 'MRVSAttachmentVariable';
        } else if (fieldType === 'container') {
            return 'MRVSContainerVariable';
        } else {
            return 'MRVSStandardVariable';
        }
    }

})(env);