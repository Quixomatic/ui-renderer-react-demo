/**
 * ServiceNow Custom GraphQL Endpoint for MRVS Data
 * 
 * Create this as a Scripted REST API in ServiceNow:
 * 1. Navigate to System Web Services > Scripted REST APIs
 * 2. Create new API with namespace like 'x_312987_turbofo' 
 * 3. Add Resource with path '/graphql/mrvs'
 * 4. Set HTTP method to POST
 * 5. Use this script
 */

(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    
    // Parse the GraphQL query from request body
    var requestBody = request.body.data;
    var query = requestBody.query || {};
    
    // Extract parameters from the query
    var variableSetId = query.variable_set_id;
    var sourceTable = query.source_table || 'sc_cat_item';
    var sourceId = query.source_id;
    var action = query.action || 'add';
    var rowData = query.row_data || {};
    
    // Response structure matching our main catalog form
    var responseData = {
        fields: {},
        variablesLayout: [],
        client_scripts: {
            onChange: [],
            onLoad: [],
            onSubmit: []
        },
        ui_policies: []
    };
    
    try {
        // 1. Get the variable set
        var vsGr = new GlideRecord('item_option_new_set');
        if (!vsGr.get(variableSetId)) {
            throw new Error('Variable set not found: ' + variableSetId);
        }
        
        // 2. Get all variables in this set
        var varGr = new GlideRecord('item_option_new');
        varGr.addQuery('variable_set', variableSetId);
        varGr.addActiveQuery();
        varGr.orderBy('order');
        varGr.query();
        
        var fieldOrder = 0;
        
        while (varGr.next()) {
            var fieldName = 'variables.' + vsGr.internal_name + '.' + varGr.name;
            
            // Map numeric type to string type
            var fieldType = _mapFieldType(varGr.type.toString());
            
            // Build field object matching our format
            var fieldObj = {
                type: fieldType,
                name: fieldName,
                label: varGr.question_text.toString(),
                mandatory: varGr.mandatory == true,
                readonly: varGr.read_only == true,
                visible: varGr.visible_on_bundles == true,
                value: '',
                displayValue: '',
                variable_name: varGr.name.toString(),
                sys_readonly: varGr.read_only == true,
                catalog_item_variable: {
                    sysparm_cat_item: sourceId
                },
                _parent: '',
                _cat_variable: true,
                is_variable: true,
                order: fieldOrder += 100,
                exampleText: varGr.example_text ? varGr.example_text.toString() : '',
                helpText: varGr.help_text ? varGr.help_text.toString() : '',
                regExp: varGr.validate_regex ? varGr.validate_regex.toString() : '',
                variableAttributes: _parseAttributes(varGr.attributes)
            };
            
            // Add type-specific properties
            if (fieldType === 'reference' || varGr.type == 8) {
                fieldObj.reference = varGr.reference.toString();
                fieldObj.referenceQual = varGr.reference_qual ? varGr.reference_qual.toString() : '';
                fieldObj.referringTable = sourceTable;
                fieldObj.referringRecordId = sourceId;
            }
            
            if (fieldType === 'choice' || fieldType === 'multiple_choice' || varGr.type == 3 || varGr.type == 5) {
                fieldObj.choices = _getChoices(varGr);
                fieldObj.includeNone = varGr.include_none == true;
            }
            
            responseData.fields[fieldName] = fieldObj;
            
            // Add to layout
            responseData.variablesLayout.push({
                name: fieldName,
                type: 'field',
                parent: ''
            });
        }
        
        // 3. Get client scripts for this variable set
        var csGr = new GlideRecord('catalog_script_client');
        csGr.addQuery('variable_set', variableSetId);
        csGr.addActiveQuery();
        csGr.query();
        
        while (csGr.next()) {
            var scriptObj = {
                name: csGr.name.toString(),
                script: csGr.script.toString(),
                fieldName: csGr.cat_variable ? 'variables.' + vsGr.internal_name + '.' + csGr.cat_variable.name : '',
                type: csGr.type.toString()
            };
            
            if (csGr.type == 'onChange') {
                responseData.client_scripts.onChange.push(scriptObj);
            } else if (csGr.type == 'onLoad') {
                responseData.client_scripts.onLoad.push(scriptObj);
            } else if (csGr.type == 'onSubmit') {
                responseData.client_scripts.onSubmit.push(scriptObj);
            }
        }
        
        // 4. Get UI policies for this variable set
        var polGr = new GlideRecord('catalog_ui_policy');
        polGr.addQuery('variable_set', variableSetId);
        polGr.addActiveQuery();
        polGr.query();
        
        while (polGr.next()) {
            var policyObj = {
                fieldName: [],
                reversed: polGr.reverse_if_false == true,
                onLoad: polGr.on_load == true,
                shortDescription: polGr.short_description.toString(),
                actions: [],
                conditions: []
            };
            
            // Get policy actions
            var actGr = new GlideRecord('catalog_ui_policy_action');
            actGr.addQuery('ui_policy', polGr.sys_id);
            actGr.query();
            
            while (actGr.next()) {
                var varName = 'variables.' + vsGr.internal_name + '.' + actGr.catalog_variable.name;
                policyObj.fieldName.push(varName);
                policyObj.actions.push({
                    name: varName,
                    visible: actGr.visible.toString(),
                    disabled: actGr.disabled.toString(),
                    mandatory: actGr.mandatory.toString(),
                    cleared: actGr.cleared.toString()
                });
            }
            
            // Parse conditions (simplified - you may need to enhance this)
            if (polGr.catalog_conditions) {
                // Parse the encoded query into conditions
                var terms = polGr.catalog_conditions.toString().split('^');
                terms.forEach(function(term) {
                    if (term) {
                        var parts = term.match(/(\w+)(\W+)(.*)/);
                        if (parts) {
                            policyObj.conditions.push({
                                field: 'variables.' + vsGr.internal_name + '.' + parts[1],
                                oper: parts[2],
                                value: parts[3]
                            });
                        }
                    }
                });
            }
            
            responseData.ui_policies.push(policyObj);
        }
        
        // If editing, populate with existing row data
        if (action === 'edit' && rowData) {
            Object.keys(rowData).forEach(function(key) {
                var fieldName = 'variables.' + vsGr.internal_name + '.' + key;
                if (responseData.fields[fieldName]) {
                    responseData.fields[fieldName].value = rowData[key] || '';
                    responseData.fields[fieldName].displayValue = rowData[key] || ''; // You'd need to fetch display values
                }
            });
        }
        
        response.setStatus(200);
        response.setContentType('application/json');
        response.setBody({
            data: responseData
        });
        
    } catch (error) {
        response.setStatus(500);
        response.setContentType('application/json');
        response.setBody({
            error: error.message,
            status: 'failure'
        });
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
    
})(request, response);