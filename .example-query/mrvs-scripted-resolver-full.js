(function process(/*ResolverEnvironment*/ env) {
    try {
        var arguments = env.getArguments();
        var variableSetId = arguments.variableSetId;
        var rowDataParam = arguments.rowData;
        
        if (!variableSetId) {
            throw new Error('variableSetId is required');
        }

        // Parse rowData if provided (expected as JSON string)
        var rowData = {};
        if (rowDataParam) {
            try {
                rowData = JSON.parse(rowDataParam);
            } catch (e) {
                gs.warn('Invalid rowData JSON: ' + rowDataParam);
            }
        }

        // 1. Get the variable set
        var vsGr = new GlideRecord('item_option_new_set');
        if (!vsGr.get(variableSetId)) {
            throw new Error('Variable set not found: ' + variableSetId);
        }

        var response = {
            variableSetId: variableSetId,
            variableSetName: vsGr.internal_name.toString(),
            maxRows: parseInt(vsGr.max_rows) || 50,
            layout: vsGr.layout ? vsGr.layout.toString() : 'normal',
            variablesLayout: [],
            variables: [],
            clientScripts: {
                onChange: [],
                onLoad: [],
                onSubmit: []
            },
            uiPolicies: []
        };

        // 2. Get all variables in this set
        var varGr = new GlideRecord('item_option_new');
        varGr.addQuery('variable_set', variableSetId);
        varGr.addActiveQuery();
        varGr.orderBy('order');
        varGr.query();

        var fieldOrder = 0;
        var allFields = []; // Collect fields first, then generate layout

        while (varGr.next()) {
            var fieldName = 'variables.' + vsGr.internal_name + '.' + varGr.name;
            var fieldType = _mapFieldType(varGr.type.toString());

            // Get value and displayValue from rowData if provided
            var fieldValue = '';
            var fieldDisplayValue = '';
            var variableName = varGr.name.toString();
            
            if (rowData && rowData[variableName]) {
                var rowFieldData = rowData[variableName];
                if (typeof rowFieldData === 'object') {
                    fieldValue = rowFieldData.value || '';
                    fieldDisplayValue = rowFieldData.displayValue || '';
                } else {
                    // If just a string value, use it for both
                    fieldValue = rowFieldData.toString();
                    fieldDisplayValue = fieldValue;
                }
            }

            // Build field object matching our format
            var fieldObj = {
                type: fieldType,
                id: varGr.sys_id.toString(),
                name: fieldName,
                variableName: variableName,
                label: varGr.question_text.toString(),
                order: fieldOrder += 100,
                mandatory: varGr.mandatory == true,
                readOnly: varGr.read_only == true,
                visible: varGr.hidden != true,
                canRead: true,
                canWrite: !varGr.read_only,
                canCreate: true,
                variableAttributes: _parseAttributes(varGr.attributes),
                defaultValue: varGr.default_value ? varGr.default_value.toString() : '',
                value: fieldValue,
                displayValue: fieldDisplayValue,
                exampleText: varGr.example_text ? varGr.example_text.toString() : '',
                helpText: varGr.help_text ? varGr.help_text.toString() : '',
                regExp: varGr.validate_regex ? varGr.validate_regex.toString() : '',
                __typename: _getTypeName(fieldType)
            };

            // Check if this is an extended variable and enrich the data
            if (varGr.sys_class_name && varGr.sys_class_name.toString() === 'x_312987_turbofo_0_question') {
                _enrichExtendedVariable(fieldObj, varGr.sys_id.toString(), rowData);
            }

            // Add type-specific properties
            if (fieldType === 'reference' || fieldType === 'glide_list' || varGr.type == 8) {
                fieldObj.reference = varGr.reference.toString();
                fieldObj.referenceQual = varGr.reference_qual ? varGr.reference_qual.toString() : '';
            }

            if (fieldType === 'choice' || fieldType === 'multiple_choice' || fieldType === 'numeric_scale' || varGr.type == 3 || varGr.type == 5) {
                fieldObj.choices = _getChoices(varGr);
                fieldObj.includeNone = varGr.include_none == true;
            }

            if (fieldType === 'attachment' || varGr.type == 17) {
                fieldObj.allowedFileExtensions = varGr.file_filter ? varGr.file_filter.toString() : '';
                fieldObj.maxAttachmentSize = varGr.max_attachment_size ? varGr.max_attachment_size.toString() : '';
            }

            if (fieldType === 'container') {
                fieldObj.displayTitle = varGr.display_title == true;
                fieldObj.layout = varGr.layout ? varGr.layout.toString() : '';
                fieldObj.containerType = 'container';
            }

            response.variables.push(fieldObj);
            allFields.push({
                name: fieldName,
                type: 'field'
            });
        }

        // Generate layout based on variable set layout setting
        response.variablesLayout = _generateLayout(response.layout, allFields, vsGr.internal_name.toString());

        // 3. Get client scripts for this variable set
        var csGr = new GlideRecord('catalog_script_client');
        csGr.addQuery('variable_set', variableSetId);
        csGr.addActiveQuery();
        csGr.query();

        while (csGr.next()) {
            var fieldName = '';
            // Try multiple ways to get the field name
            if (csGr.cat_variable && csGr.cat_variable.name) {
                fieldName = 'variables.' + vsGr.internal_name + '.' + csGr.cat_variable.name.toString();
            } else if (csGr.variable && csGr.variable.toString()) {
                fieldName = 'variables.' + vsGr.internal_name + '.' + csGr.variable.toString();
            } else if (csGr.cat_variable && csGr.cat_variable.toString()) {
                // Handle encoded reference like "IO:cc4f874883c7e690e8fbc9a6feaad32a"
                var catVarRef = csGr.cat_variable.toString();
                if (catVarRef.startsWith('IO:')) {
                    var variableSysId = catVarRef.substring(3); // Remove 'IO:' prefix
                    var varName = _getVariableNameBySysId(variableSysId);
                    if (varName) {
                        fieldName = 'variables.' + vsGr.internal_name + '.' + varName;
                    }
                }
            }
            
            var scriptObj = {
                name: csGr.name.toString(),
                sysId: csGr.sys_id.toString(),
                script: csGr.script.toString(),
                type: csGr.type.toString(),
                fieldName: fieldName
            };

            if (csGr.type == 'onChange') {
                response.clientScripts.onChange.push(scriptObj);
            } else if (csGr.type == 'onLoad') {
                response.clientScripts.onLoad.push(scriptObj);
            } else if (csGr.type == 'onSubmit') {
                response.clientScripts.onSubmit.push(scriptObj);
            }
        }

        // 4. Get UI policies for this variable set
        var polGr = new GlideRecord('catalog_ui_policy');
        polGr.addQuery('variable_set', variableSetId);
        polGr.addActiveQuery();
        polGr.query();

        while (polGr.next()) {
            var policyObj = {
                shortDescription: polGr.short_description.toString(),
                sysId: polGr.sys_id.toString(),
                reverse: polGr.reverse_if_false == true,
                onLoad: polGr.on_load == true,
                actions: [],
                conditions: []
            };

            // Get policy actions
            var actGr = new GlideRecord('catalog_ui_policy_action');
            actGr.addQuery('ui_policy', polGr.sys_id);
            actGr.query();

            while (actGr.next()) {
                var varName = '';
                // Try multiple ways to get the field name - use 'variable' field from XML
                if (actGr.variable && actGr.variable.toString()) {
                    varName = 'variables.' + vsGr.internal_name + '.' + actGr.variable.toString();
                } else if (actGr.catalog_variable && actGr.catalog_variable.name) {
                    varName = 'variables.' + vsGr.internal_name + '.' + actGr.catalog_variable.name.toString();
                }
                
                policyObj.actions.push({
                    name: varName,
                    visible: actGr.visible.toString(),
                    disabled: actGr.disabled.toString(),
                    mandatory: actGr.mandatory.toString(),
                    cleared: actGr.cleared.toString()
                });
            }

            // Parse conditions with proper IO: reference decoding
            if (polGr.catalog_conditions) {
                // Parse the encoded query into conditions
                var terms = polGr.catalog_conditions.toString().split('^');
                terms.forEach(function(term) {
                    if (term) {
                        // Handle IO: encoded references like "IO:8bb2d700834be690e8fbc9a6feaad330=value"
                        if (term.startsWith('IO:')) {
                            // Extract the sys_id and value from IO:sys_id=value format
                            var ioMatch = term.match(/^IO:([^=]+)=(.*)$/);
                            if (ioMatch) {
                                var variableSysId = ioMatch[1];
                                var conditionValue = ioMatch[2];
                                
                                // Get the actual variable name by sys_id
                                var varName = _getVariableNameBySysId(variableSysId);
                                if (varName) {
                                    policyObj.conditions.push({
                                        term: term,
                                        field: 'variables.' + vsGr.internal_name + '.' + varName,
                                        fieldLabel: varName,
                                        type: 'string',
                                        value: conditionValue,
                                        oper: '=',
                                        operatorLabel: 'is'
                                    });
                                }
                            }
                        } else {
                            // Handle regular conditions (non-IO encoded)
                            var parts = term.match(/(\w+)(\W+)(.*)/);
                            if (parts) {
                                var fieldName = parts[1];
                                var operator = parts[2];
                                var value = parts[3];
                                
                                // Map operators to readable labels
                                var operatorMap = {
                                    '=': 'is',
                                    '!=': 'is not',
                                    '>': 'greater than',
                                    '<': 'less than',
                                    '>=': 'greater than or equal to',
                                    '<=': 'less than or equal to',
                                    'LIKE': 'contains',
                                    'STARTSWITH': 'starts with',
                                    'ENDSWITH': 'ends with'
                                };
                                
                                policyObj.conditions.push({
                                    term: term,
                                    field: 'variables.' + vsGr.internal_name + '.' + fieldName,
                                    fieldLabel: fieldName,
                                    type: 'string',
                                    value: value,
                                    oper: operator,
                                    operatorLabel: operatorMap[operator] || operator
                                });
                            }
                        }
                    }
                });
            }

            response.uiPolicies.push(policyObj);
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
        } else if (fieldType === 'choice' || fieldType === 'multiple_choice' || fieldType === 'numeric_scale') {
            return 'MRVSChoiceVariable';
        } else if (fieldType === 'attachment') {
            return 'MRVSAttachmentVariable';
        } else if (fieldType === 'container') {
            return 'MRVSContainerVariable';
        } else {
            return 'MRVSStandardVariable';
        }
    }

    // Helper to get choices for choice fields
    function _getChoices(varGr) {
        var choices = [];

        // Check if choices are defined in related table
        var choiceGr = new GlideRecord('question_choice');
        choiceGr.addQuery('question', varGr.sys_id);
        choiceGr.orderBy('order');
        choiceGr.query();

        while (choiceGr.next()) {
            choices.push({
                value: choiceGr.value.toString(),
                displayValue: choiceGr.text.toString()
            });
        }

        return choices;
    }

    // Helper to parse variable attributes
    function _parseAttributes(attributesStr) {
        if (!attributesStr) return '';

        // Parse comma-separated attributes
        var attrs = {};
        var parts = attributesStr.toString().split(',');
        parts.forEach(function(part) {
            var kv = part.split('=');
            if (kv.length === 2) {
                attrs[kv[0].trim()] = kv[1].trim();
            }
        });

        return JSON.stringify(attrs);
    }

    // Helper to generate layout based on variable set layout setting
    function _generateLayout(layoutType, allFields, variableSetName) {
        if (layoutType === 'normal' || !layoutType) {
            // Single column - each field gets its own layout item
            return allFields.map(function(field) {
                return {
                    name: field.name,
                    type: field.type,
                    parent: ''
                };
            });
        } else if (layoutType === '2across' || layoutType === '2down') {
            // Two column layout - create container with columns
            var containerName = 'variables.' + variableSetName + '_container';
            var layout = [{
                name: containerName,
                type: 'container',
                parent: '',
                caption: '',
                captionDisplay: '',
                layout: 'normal',
                columns: []
            }];

            if (layoutType === '2across') {
                // Alternating sides - distribute fields evenly across columns
                var column1 = { fields: [] };
                var column2 = { fields: [] };
                
                for (var i = 0; i < allFields.length; i++) {
                    if (i % 2 === 0) {
                        column1.fields.push(allFields[i]);
                    } else {
                        column2.fields.push(allFields[i]);
                    }
                }
                
                layout[0].columns = [column1, column2];
                
            } else if (layoutType === '2down') {
                // One side then the other - split fields in half
                var halfPoint = Math.ceil(allFields.length / 2);
                var column1 = { fields: allFields.slice(0, halfPoint) };
                var column2 = { fields: allFields.slice(halfPoint) };
                
                layout[0].columns = [column1, column2];
            }

            return layout;
        }

        // Default fallback
        return allFields.map(function(field) {
            return {
                name: field.name,
                type: field.type,
                parent: ''
            };
        });
    }

    // Helper to get variable name by sys_id (for decoding client script references)
    function _getVariableNameBySysId(variableSysId) {
        var varGr = new GlideRecord('item_option_new');
        if (varGr.get(variableSysId)) {
            return varGr.name.toString();
        }
        return null;
    }

    // Helper to enrich extended variable data
    function _enrichExtendedVariable(fieldObj, variableSysId, rowData) {
        var extGr = new GlideRecord('x_312987_turbofo_0_question'),
            qu = new tfQuickUtils(), // Initialize QuickUtils
            iu = new tfInstanceUtils(); // Initialize InstanceUtils
            
        if (!extGr.get(variableSysId)) {
            return; // Extended record not found
        }

        // Add extended properties
        fieldObj.subType = extGr.getValue('sub_type');
        fieldObj.defaultValue = extGr.getValue('default_value');
        fieldObj.tooltip = extGr.getValue('tooltip');

        // Parse attributes using QuickUtils method
        if (fieldObj.variableAttributes) {
            fieldObj.parsedAttributes = qu.parseFieldAttributes(fieldObj.variableAttributes);
        }

        // Enhanced validation for regex fields using qu.getField
        if (fieldObj.regExp) {
            fieldObj.validation = {
                name: qu.getField(extGr, 'validate_regex.name'),
                validation_message: qu.getField(extGr, 'validate_regex.validation_message'),
                active: qu.getField(extGr, 'validate_regex.active'),
                regex: qu.getField(extGr, 'validate_regex.regex')
            };
        }

        // Reference field enhancements
        if (fieldObj.type === 'reference') {
            var tempRecord = new GlideRecord(extGr.getValue('reference'));
            
            // Get table fields using QuickUtils method
            fieldObj.tableFields = qu.getTableColumns(
                extGr.getValue('reference'),
                extGr.getValue('table_fields') || tempRecord.getDisplayName()
            );

            // Compile reference qualifier with context (mimicking getCompiledQualifier)
            fieldObj.qualifier = _getCompiledQualifier(extGr, null, rowData, rowData, qu);

            // Handle reference qualifier scripts
            if (extGr.getValue('use_reference_qualifier_script') == '1') {
                var evaluator = new GlideScopedEvaluator();
                evaluator.putVariable('utils', iu);
                evaluator.putVariable('tableRecord', null); // No record context in MRVS
                evaluator.putVariable('answer', null);
                
                evaluator.evaluateScript(extGr, 'reference_qualifier_script', null);
                
                var scriptResult = evaluator.getVariable('answer');
                if (scriptResult) {
                    fieldObj.qualifier = scriptResult;
                }
            }

            // For tile_choice subtype, add value field
            if (fieldObj.subType === 'tile_choice') {
                fieldObj.valueField = extGr.getValue('value_field');
            }
        }

        // Glide list field enhancements
        if (fieldObj.type === 'glide_list') {
            var tempRecord = new GlideRecord(extGr.getValue('list_table'));
            
            fieldObj.tableFields = qu.getTableColumns(
                extGr.getValue('list_table'),
                extGr.getValue('table_fields') || tempRecord.getDisplayName()
            );
        }

        // Requested for field (special case of reference)
        if (fieldObj.type === 'requested_for') {
            var tempRecord = new GlideRecord('sys_user');
            fieldObj.tableFields = qu.getTableColumns('sys_user', tempRecord.getDisplayName());
        }

        // String field with existing_value_text subtype
        if (fieldObj.type === 'string' && fieldObj.subType === 'existing_value_text') {
            // For MRVS, we don't have record context, so we'll leave the template as-is
            // In a full implementation, you'd use: qu.compileText(fieldObj.value, record)
            fieldObj.needsTextCompilation = true;
            fieldObj.compiledValue = fieldObj.value; // Keep original template
        }

        // Numeric scale enhancements
        if (fieldObj.type === 'numeric_scale') {
            fieldObj.min = extGr.getValue('scale_min');
            fieldObj.max = extGr.getValue('scale_max');
        }
    }

    // Helper function to compile reference qualifiers (mimicking getCompiledQualifier from your script)
    function _getCompiledQualifier(questionRecord, tableRecord, localAnswerObject, totalAnswerObject, qu) {
        var qualifier = questionRecord.getValue('reference_qual');
        if (!qualifier) return '';

        try {
            return qu.compileMeta(qualifier, {
                current: {
                    type: 'glide',
                    data: tableRecord // Will be null for MRVS context
                },
                local: {
                    type: 'object', 
                    data: localAnswerObject
                },
                variables: {
                    type: 'object',
                    data: totalAnswerObject
                }
            });
        } catch (e) {
            gs.warn('Failed to compile reference qualifier: ' + qualifier + ' - Error: ' + e.message);
            return qualifier; // Return original if compilation fails
        }
    }


})(env);