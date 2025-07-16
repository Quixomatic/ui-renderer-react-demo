import React, { useState, useEffect } from "react";

// Real shadcn/ui components
import { Button } from "../../../components/ui/button.jsx";
import { Input } from "../../../components/ui/input.jsx";
import { Label } from "../../../components/ui/label.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card.jsx";
import { Textarea } from "../../../components/ui/textarea.jsx";

export default function ShadcnExample(state) {
    const { dispatch, properties } = state;
    const { title } = properties;
    const { submitted, submittedData } = state;

    // Add debugging
    useEffect(() => {
        console.log('🚀 ShadcnExample React component mounted');
        console.log('React version:', React.version);
        console.log('Component state:', state);
        console.log('Properties:', properties);
        return () => {
            console.log('🔥 ShadcnExample React component unmounted');
        };
    }, []);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });

    const handleInputChange = (field) => (e) => {
        console.log(`📝 Input change - ${field}:`, e.target.value);
        setFormData(prev => ({
            ...prev,
            [field]: e.target.value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('📤 Form submitted with data:', formData);
        dispatch('FORM_SUBMIT', formData);
    };

    const handleReset = () => {
        console.log('🔄 Form reset');
        setFormData({ name: '', email: '', message: '' });
        dispatch('RESET_FORM');
    };

    if (submitted) {
        return (
            <div className="react-ui-wrapper">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-center">Success!</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <p className="text-center text-muted-foreground">
                                Form submitted successfully within shadow DOM.
                            </p>
                            <div className="bg-muted p-4 rounded-md">
                                <h4 className="font-semibold mb-2">Submitted Data:</h4>
                                <pre className="text-sm">{JSON.stringify(submittedData, null, 2)}</pre>
                            </div>
                            <Button onClick={handleReset} className="w-full">
                                Submit Another Form
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="react-ui-wrapper">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        External UI components working in ServiceNow shadow DOM
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                type="text"
                                value={formData.name}
                                onChange={handleInputChange('name')}
                                placeholder="Enter your name"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange('email')}
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea
                                id="message"
                                className="min-h-[100px] resize-none"
                                value={formData.message}
                                onChange={handleInputChange('message')}
                                placeholder="Enter your message"
                                required
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" className="flex-1">
                                Submit
                            </Button>
                            <Button type="button" variant="outline" onClick={handleReset}>
                                Reset
                            </Button>
                        </div>
                    </form>

                    <div className="mt-6 pt-4 border-t">
                        <h4 className="font-semibold mb-2">UI Components Demo:</h4>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="default" size="sm">Default</Button>
                            <Button variant="secondary" size="sm">Secondary</Button>
                            <Button variant="outline" size="sm">Outline</Button>
                            <Button variant="ghost" size="sm">Ghost</Button>
                        </div>
                        <div className="mt-4 text-xs text-muted-foreground">
                            React v{React.version} | ServiceNow Shadow DOM
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
