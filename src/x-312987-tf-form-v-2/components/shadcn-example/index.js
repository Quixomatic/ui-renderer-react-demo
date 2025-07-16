import { createCustomElement } from "@servicenow/ui-core";
import react from "@servicenow/ui-renderer-react";
import view from "./view";
import styles from "./styles.scss";

createCustomElement("shadcn-example", {
    renderer: { type: react },
    view,
    properties: {
        title: {
            default: "shadcn/ui Example"
        },
        variant: {
            default: "default"
        }
    },
    actionHandlers: {
        FORM_SUBMIT: ({ action, updateState }) => {
            console.log('Form submitted:', action.payload);
            updateState({ submitted: true, submittedData: action.payload });
        },
        RESET_FORM: ({ updateState }) => {
            updateState({ submitted: false, submittedData: null });
        }
    },
    styles
});