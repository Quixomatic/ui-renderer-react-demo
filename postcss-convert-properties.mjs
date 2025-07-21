// PostCSS plugin to convert @property rules to regular CSS custom properties
export default function convertProperties() {
  return {
    postcssPlugin: 'postcss-convert-properties',
    AtRule: {
      property(rule) {
        const propertyName = rule.params;
        let initialValue = '';
        
        // Extract initial-value from the @property rule
        rule.walkDecls('initial-value', decl => {
          initialValue = decl.value;
        });
        
        // If we found a property with an initial value, add it to existing :root/:host rules
        if (propertyName && initialValue) {
          // Find the parent layer (if any)
          let parent = rule.parent;
          let layerRule = null;
          
          while (parent) {
            if (parent.type === 'atrule' && parent.name === 'layer') {
              layerRule = parent;
              break;
            }
            parent = parent.parent;
          }
          
          // Look for existing :root, :host rules within the same layer or root
          const searchScope = layerRule || rule.root();
          let rootHostRule = null;
          
          searchScope.walkRules(r => {
            // Look for ":root, :host" selector or just ":root" or ":host"
            if (r.selector === ':root, :host' || r.selector === ':host, :root' || 
                r.selector === ':root' || r.selector === ':host') {
              rootHostRule = r;
            }
          });
          
          // Add the property to existing :root,:host rule if found
          if (rootHostRule && !rootHostRule.some(decl => decl.prop === propertyName)) {
            rootHostRule.append({
              prop: propertyName,
              value: initialValue
            });
          }
        }
        
        // Remove the @property rule
        rule.remove();
      }
    }
  };
}

convertProperties.postcss = true;