"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { Settings, Globe, Building2, Factory, Loader2 } from 'lucide-react';

export default function CompanyForm() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: Form, 2: Analysis, 3: Confirmation
    const [formData, setFormData] = useState({
        company_name: '',
        industry: '',
        website_url: ''
    });
    const [scrapedData, setScrapedData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [competitors, setCompetitors] = useState([]);
    const [analyzingCompetitors, setAnalyzingCompetitors] = useState(false);
    const [selectedCompetitors, setSelectedCompetitors] = useState([]);
    const [analyzingSelected, setAnalyzingSelected] = useState(false);
    const [competitorAnalysis, setCompetitorAnalysis] = useState({});

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAnalyzeWebsite = async () => {
        setLoading(true);
        setError('');

        if (!formData.company_name || !formData.website_url) {
            setError('Company name and website URL are required');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('https://varun324242-sjuu.hf.space/api/analyze-website', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    detail_level: 'quick',
                    website_url: formData.website_url,
                    company_name: formData.company_name,
                    industry: formData.industry || ''
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to analyze website');
            }

            console.log('Analysis response:', data);
            setScrapedData(data);
            setStep(2);
        } catch (err) {
            console.error('Analysis error:', err);
            setError('Failed to analyze website: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAll = async () => {
        setLoading(true);
        setError('');

        try {
            // Prepare the data
            const companyData = {
                name: formData.company_name.trim(),
                industrie: formData.industry.trim() || '',
                website: formData.website_url.trim(),
                data: JSON.stringify({
                    analysis: scrapedData,
                    competitors: selectedCompetitors.map(comp => ({
                        ...comp,
                        analysis: competitorAnalysis[comp.url]
                    }))
                }),
                created_at: new Date().toISOString()
            };

            // Insert into Supabase
            const { error: insertError } = await supabase
                .from('sss')
                .insert([companyData]);

            if (insertError) throw insertError;

            // Store competitor data if available
            if (selectedCompetitors.length > 0) {
                const competitorData = selectedCompetitors.map(comp => ({
                    name: comp.name,
                    website: comp.url,
                    data: JSON.stringify(competitorAnalysis[comp.url]),
                    comparison: comp.comparison,
                    created_at: new Date().toISOString()
                }));

                const { error: competitorError } = await supabase
                    .from('competitors')  // Assuming you have a competitors table
                    .insert(competitorData);

                if (competitorError) throw competitorError;
            }

            console.log('Saved company data:', companyData);
            router.push('/pro-mode');
        } catch (err) {
            setError('Failed to save data: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const analyzeCompetitors = async () => {
        setAnalyzingCompetitors(true);
        try {
            const prompt = `Based on this company data:
            Company Name: ${formData.company_name}
            Industry: ${formData.industry}
            Website Content: ${scrapedData?.data || ''}
            
            Please identify the top 5 direct competitors. Return ONLY a JSON array with exactly this format:
            [
                {
                    "name": "Competitor Name",
                    "url": "https://competitor-website.com",
                    "comparison": "Brief comparison with ${formData.company_name}"
                }
            ]
            
            Do not include any other text, only the JSON array.`;

            const options = {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer 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',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "llama-3.1-sonar-small-128k-online",
                    messages: [
                        {
                            role: "system",
                            content: "You are a business analyst. Always respond with valid JSON arrays containing competitor information. Never include explanatory text."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.1, // Reduced for more consistent formatting
                    top_p: 0.9,
                    max_tokens: 2048
                })
            };

            const response = await fetch('https://api.perplexity.ai/chat/completions', options);
            const data = await response.json();
            
            // Get the response content
            const content = data.choices[0].message.content;
            
            // Clean the response - remove any markdown formatting
            const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
            
            console.log('API Response:', cleanContent);
            
            try {
                // Parse the cleaned JSON
                const competitorData = JSON.parse(cleanContent);
                
                // Validate the data structure
                if (!Array.isArray(competitorData)) {
                    throw new Error('Response is not an array');
                }
                
                // Validate each competitor object
                const validCompetitors = competitorData.filter(comp => 
                    comp.name && comp.url && comp.comparison
                );
                
                setCompetitors(validCompetitors);
                
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError);
                setError('Failed to parse competitor data. Please try again.');
            }
            
        } catch (err) {
            console.error('Error analyzing competitors:', err);
            setError('Failed to analyze competitors: ' + err.message);
        } finally {
            setAnalyzingCompetitors(false);
        }
    };

    const toggleCompetitorSelection = (competitor) => {
        setSelectedCompetitors(prev => {
            if (prev.find(c => c.url === competitor.url)) {
                return prev.filter(c => c.url !== competitor.url);
            }
            return [...prev, competitor];
        });
    };

    const storeCompetitorData = async (competitor, scrapedData) => {
        try {
            if (scrapedData) {
                const textData = {
                    title: scrapedData.title || '',
                    description: scrapedData.description || '',
                    content: typeof scrapedData.data === 'string' 
                        ? scrapedData.data 
                        : JSON.stringify(scrapedData.data),
                    metadata: {
                        scrapeDate: new Date().toISOString(),
                        source: competitor.url,
                        industry: formData.industry || 'Unknown'
                    }
                };

                const { error } = await supabase
                    .from('competitors')
                    .insert([{
                        name: competitor.name,
                        website: competitor.url,
                        data: JSON.stringify(textData),
                        created_at: new Date().toISOString()
                    }]);

                if (error) throw error;
                console.log(`Successfully stored data for ${competitor.name}`);
            }
        } catch (err) {
            console.error(`Failed to store data for ${competitor.name}:`, err);
        }
    };

    const analyzeSelectedCompetitors = async () => {
        setAnalyzingSelected(true);
        setError('');

        try {
            for (const competitor of selectedCompetitors) {
                console.log(`Analyzing competitor: ${competitor.name}`);
                
                // Call your scraping API for each competitor
                const response = await fetch('https://varun324242-sjuu.hf.space/api/analyze-website', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        detail_level: 'quick',
                        website_url: competitor.url,
                        company_name: competitor.name,
                        industry: formData.industry || ''
                    })
                });

                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(`Failed to analyze ${competitor.name}'s website`);
                }

                // Store analysis data in state
                setCompetitorAnalysis(prev => ({
                    ...prev,
                    [competitor.url]: data
                }));

                // Store in localStorage if scraping was successful
                if (data) {
                    storeCompetitorData(competitor, data);
                    console.log(`Stored data for ${competitor.name} in localStorage`);
                }
            }
        } catch (err) {
            console.error('Error analyzing competitor websites:', err);
            setError('Failed to analyze competitor websites: ' + err.message);
        } finally {
            setAnalyzingSelected(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#121212] text-white">
            {/* Modern Header */}
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 max-w-screen-2xl items-center">
                    <div className="mr-4 flex">
                        <a className="mr-6 flex items-center space-x-2" href="/">
                            <span className="font-bold text-xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Company Analysis
                            </span>
                        </a>
                    </div>
                    <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                        <button
                            onClick={() => {/* Add settings handler */}}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 py-2 w-9 px-0"
                        >
                            <Settings className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="container max-w-screen-md mx-auto px-4 py-8">
                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex justify-between text-sm mb-2">
                        <div className={`flex items-center ${step >= 1 ? 'text-purple-400' : 'text-gray-500'}`}>
                            <Building2 className="w-4 h-4 mr-2" />
                            Company Details
                        </div>
                        <div className={`flex items-center ${step >= 2 ? 'text-purple-400' : 'text-gray-500'}`}>
                            <Globe className="w-4 h-4 mr-2" />
                            Website Analysis
                        </div>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full">
                        <div 
                            className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all duration-300"
                            style={{ width: `${(step/2) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div className="flex items-center space-x-2 text-red-400">
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {/* Form Container */}
                <div className="bg-gray-800/30 rounded-lg border border-gray-700/50 backdrop-blur-sm">
                    {step === 1 ? (
                        <div className="p-6 space-y-6">
                            <h2 className="text-xl font-semibold text-purple-400 flex items-center">
                                <Building2 className="w-5 h-5 mr-2" />
                                Company Information
                            </h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                        Company Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="company_name"
                                        value={formData.company_name}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 bg-gray-900/50 rounded-md border border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-gray-100"
                                        placeholder="Enter company name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                        Website URL *
                                    </label>
                                    <input
                                        type="url"
                                        name="website_url"
                                        value={formData.website_url}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 bg-gray-900/50 rounded-md border border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-gray-100"
                                        placeholder="https://example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                        Industry
                                    </label>
                                    <input
                                        type="text"
                                        name="industry"
                                        value={formData.industry}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 bg-gray-900/50 rounded-md border border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-gray-100"
                                        placeholder="e.g., Technology, Healthcare"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleAnalyzeWebsite}
                                disabled={loading || !formData.website_url || !formData.company_name}
                                className="w-full flex items-center justify-center px-4 py-2.5 rounded-md font-medium bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    'Analyze Website'
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="p-6 space-y-6">
                            <h2 className="text-xl font-semibold text-purple-400 flex items-center">
                                <Globe className="w-5 h-5 mr-2" />
                                Analysis Results
                            </h2>

                            {/* Analysis Results Card */}
                            <div className="bg-gray-900/50 rounded-lg border border-gray-700/50 p-4">
                                <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                                    {JSON.stringify(scrapedData, null, 2)}
                                </pre>
                            </div>

                            {/* Competitor Analysis Section */}
                            <div className="space-y-4">
                                <button
                                    onClick={analyzeCompetitors}
                                    disabled={analyzingCompetitors}
                                    className="w-full flex items-center justify-center px-4 py-2.5 rounded-md font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    {analyzingCompetitors ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Analyzing Competitors...
                                        </>
                                    ) : (
                                        'Analyze Competitors'
                                    )}
                                </button>

                                {/* Competitors Grid */}
                                {competitors.length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-medium text-purple-400">
                                            Competitors
                                        </h3>
                                        <div className="grid gap-4">
                                            {competitors.map((competitor, index) => (
                                                <div
                                                    key={index}
                                                    className={`bg-gray-800/50 p-4 rounded-lg border transition-all cursor-pointer ${
                                                        selectedCompetitors.find(c => c.url === competitor.url)
                                                            ? 'border-purple-500'
                                                            : 'border-gray-700/50'
                                                    }`}
                                                    onClick={() => toggleCompetitorSelection(competitor)}
                                                >
                                                    <div className="flex justify-between">
                                                        <h4 className="text-purple-300 font-medium">
                                                            {competitor.name}
                                                        </h4>
                                                        {selectedCompetitors.find(c => c.url === competitor.url) && (
                                                            <span className="text-green-400">✓</span>
                                                        )}
                                                    </div>
                                                    <a
                                                        href={competitor.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-400 hover:text-blue-300 text-sm"
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        {competitor.url}
                                                    </a>
                                                    <p className="mt-2 text-gray-400 text-sm">
                                                        {competitor.comparison}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="px-4 py-2 rounded-md font-medium border border-gray-700 hover:border-purple-500/50 text-gray-300"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSaveAll}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 rounded-md font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white transition-all disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin inline" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save & Continue'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
} 