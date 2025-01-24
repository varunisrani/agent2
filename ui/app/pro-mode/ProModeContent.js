"use client";

import { useState, useCallback, memo, useRef, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Settings, Globe, ChartBar, Target, Loader2, ArrowLeft, BarChart3, Search } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

const SCRAPE_API_BASE_URL = 'https://varun324242-sjuu.hf.space';
const PERPLEXITY_API_BASE_URL = 'https://varun324242-sjuuper.hf.space';

// Update color theme constants
const THEME = {
    light: {
        bg: 'bg-white',
        text: 'text-gray-900',
        border: 'border-gray-200',
        card: 'bg-gray-50/30',
        cardBorder: 'border-gray-200/50',
        accent: 'text-purple-600',
        accentHover: 'hover:text-purple-500',
        buttonPrimary: 'bg-purple-600 hover:bg-purple-500',
        buttonSecondary: 'bg-gray-100 hover:bg-gray-200',
    },
    dark: {
        bg: 'bg-[#121212]',
        text: 'text-gray-100',
        border: 'border-gray-800',
        card: 'bg-gray-800/30',
        cardBorder: 'border-gray-700/50',
        accent: 'text-purple-400',
        accentHover: 'hover:text-purple-300',
        buttonPrimary: 'bg-purple-500 hover:bg-purple-400',
        buttonSecondary: 'bg-gray-800 hover:bg-gray-700',
    }
};

// Add large title text at the top
const PageTitle = () => (
    <div className="text-center mb-12">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Professional Analysis Mode
        </h1>
        <p className="text-xl text-gray-400 mt-4">
            Get detailed insights and analysis for your business
        </p>
    </div>
);

// Memoize input components to prevent unnecessary re-renders
const InputField = memo(({ label, name, value, onChange, type = "text", placeholder, required = false }) => {
    const inputRef = useRef();

    const handleChange = (e) => {
        console.log(`Input ${name} changed to: ${e.target.value}`);
        onChange(e);
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-purple-400 mb-2">
                {label} {required && '*'}
            </label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={handleChange}
                className={cn(
                    "w-full p-2.5 bg-[#2D2D2F]/50 text-white rounded-lg border border-gray-700/50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10",
                    "bg-white dark:bg-gray-900",
                    "border border-gray-200 dark:border-gray-700",
                    "focus:border-purple-500 dark:focus:border-purple-400",
                    "focus:ring-2 focus:ring-purple-500/10 dark:focus:ring-purple-400/10"
                )}
                placeholder={placeholder}
                required={required}
            />
        </div>
    );
});
// Add display name
InputField.displayName = 'InputField';

// Add logging utility
const logAnalysisStep = (step, data) => {
    console.group(`🔍 Analysis Step: ${step}`);
    console.log(JSON.stringify(data, null, 2));
    console.groupEnd();
};

// Add API configuration
const API_CONFIG = {
    baseUrl: 'https://varun324242-sjuu.hf.space',
    timeout: 30000,
    retries: 3
};

// Add retry utility
const fetchWithRetry = async (url, options, retries = 3) => {
    try {
        const response = await fetch(url, {
            ...options,
            signal: AbortSignal.timeout(30000)
        });
        return response;
    } catch (err) {
        if (retries > 0) {
            console.log(`Retrying request... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchWithRetry(url, options, retries - 1);
        }
        throw err;
    }
};

// Add ErrorDisplay component
const ErrorDisplay = ({ error }) => {
    if (!error) return null;
    
    return (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-start gap-3">
                <div className="text-red-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                        />
                    </svg>
                </div>
                <div>
                    <h3 className="text-sm font-medium text-red-400">Error</h3>
                    <p className="mt-1 text-sm text-red-300">{error}</p>
                </div>
            </div>
        </div>
    );
};

export default function ProModeContent() {
    const { theme } = useTheme();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [companyData, setCompanyData] = useState(null);

    // Form states
    const [detailLevel, setDetailLevel] = useState(null);
    const [reportType, setReportType] = useState(null);
    const [formData, setFormData] = useState({
        company_name: '',
        industry: '',
        website_url: '',
        focus_areas: []
    });
    const [websiteAnalysis, setWebsiteAnalysis] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [report, setReport] = useState(null);
    const [analysisMethod, setAnalysisMethod] = useState(null);
    const [competitorData, setCompetitorData] = useState([]);

    // Fetch company data from Supabase
    const fetchCompanyData = async () => {
        try {
            console.group('📊 Fetching Company Data');
            
            const { data, error } = await supabase
                .from('sss')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;

            if (data && data.length > 0) {
                const mostRecent = data[0];
                let parsedData;
                try {
                    parsedData = JSON.parse(mostRecent.data);
                } catch (e) {
                    console.warn('Failed to parse company data:', e);
                    parsedData = {};
                }

                // Structure the company data properly
                const companyInfo = {
                    company_name: mostRecent.name || '',
                    industry: mostRecent.industrie || '',
                    website_url: mostRecent.website || '',
                    scraped_data: parsedData,
                    analysis: parsedData?.metadata?.analysis || {},
                    created_at: mostRecent.created_at
                };

                console.log('Fetched company data:', companyInfo);
                setCompanyData(companyInfo);
                
                // Also update the form data
                setFormData(prev => ({
                    ...prev,
                    company_name: companyInfo.company_name,
                    industry: companyInfo.industry,
                    website_url: companyInfo.website_url
                }));

                // Set website analysis if available
                if (parsedData?.content) {
                    try {
                        const websiteContent = JSON.parse(parsedData.content);
                        setWebsiteAnalysis({
                            website_data: websiteContent,
                            analysis: websiteContent?.analysis || {}
                        });
                    } catch (e) {
                        console.warn('Failed to parse website content:', e);
                    }
                }

            } else {
                throw new Error('No company data found');
            }

            console.groupEnd();
        } catch (err) {
            console.error('Error fetching company data:', err);
            setError('Error loading company data: ' + err.message);
        }
    };

    // Update fetchCompetitorData to use s1 table
    const fetchCompetitorData = async () => {
        try {
            console.group('📊 Fetching Competitor Data');
            console.time('Fetch Duration');

            const { data: competitors, error } = await supabase
                .from('s1')
                .select('id, company_name, company_website, company_data, created_at')
                .order('created_at', { ascending: false });

            if (error) throw error;

            console.log('Found Competitors:', competitors?.length);
            
            const processedCompetitors = competitors?.map(comp => {
                try {
                    const parsedData = JSON.parse(comp.company_data);
                    return {
                        id: comp.id,
                        name: comp.company_name,
                        website: comp.company_website,
                        data: parsedData,
                        created_at: comp.created_at,
                        // Extract useful information from parsed data
                        analysis: parsedData.metadata ? {
                            industry: parsedData.metadata.industry,
                            scrapeDate: parsedData.metadata.scrapeDate
                        } : null,
                        websiteData: parsedData.content ? JSON.parse(parsedData.content) : null
                    };
                } catch (parseError) {
                    console.error(`Error parsing data for competitor ${comp.company_name}:`, parseError);
                    return {
                        id: comp.id,
                        name: comp.company_name,
                        website: comp.company_website,
                        created_at: comp.created_at,
                        error: 'Data parsing error'
                    };
                }
            });

            // Log processed competitors
            processedCompetitors?.forEach((comp, index) => {
                console.group(`Competitor ${index + 1}: ${comp.name}`);
                console.log('Website:', comp.website);
                console.log('Industry:', comp.analysis?.industry);
                console.log('Scraped Date:', comp.analysis?.scrapeDate);
                console.log('Data Available:', !!comp.websiteData);
                console.groupEnd();
            });

            setCompetitorData(processedCompetitors || []);
            console.timeEnd('Fetch Duration');
            console.groupEnd();
            return processedCompetitors || [];
        } catch (err) {
            console.error('❌ Error fetching competitor data:', err);
            setError('Failed to fetch competitor data: ' + err.message);
            return [];
        }
    };

    useEffect(() => {
        fetchCompanyData();
    }, []);

    const handleAnalysisClick = async (method) => {
        if (!companyData) {
            setError('Company information is required. Please set it up first.');
            return;
        }

        console.log(`Selected ${method} analysis for ${detailLevel} level`);
        setLoading(true);
        setError(null);

        try {
            const apiBaseUrl = method === 'scrape' ? SCRAPE_API_BASE_URL : PERPLEXITY_API_BASE_URL;
            const endpoint = method === 'scrape' ? '/api/analyze-website' : '/api/analyze';
            
            // Create a properly structured payload
            const payload = {
                detail_level: detailLevel,
                company_name: companyData.company_name,
                website_url: companyData.website_url,
                industry: companyData.industry,
                metadata: {
                    analysis_type: method,
                    company_info: {
                        name: companyData.company_name,
                        industry: companyData.industry,
                        website: companyData.website_url
                    }
                }
            };

            // Log the request details
            console.log('Making request to:', `${apiBaseUrl}${endpoint}`);
            console.log('Request payload:', JSON.stringify(payload, null, 2));

            const response = await fetch(`${apiBaseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('API Response:', data);

            if (data.status === 'error') {
                throw new Error(data.message || 'Analysis failed');
            }

            setAnalysisMethod(method);
            setWebsiteAnalysis(data);
            
            // Move to next step
            setStep(prevStep => prevStep + 1);
        } catch (err) {
            console.error('Analysis error:', err);
            setError(`Failed to analyze: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Handle input changes with debounce
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle text area changes - only updates state when user finishes typing
    const handleAnswerChange = (questionId, value) => {
        if (!value.trim()) return; // Don't save empty answers
        
        setAnswers(prev => ({
            ...prev,
            [questionId]: value.trim()
        }));
        console.log(`Updated answer for question ${questionId}:`, value.trim());
    };

    // Add validation before allowing report generation
    const canGenerateReport = () => {
        return questions.length > 0 && 
               questions.every(q => answers[q.id]?.trim()) &&
               companyData &&
               reportType &&
               detailLevel;
    };

    // Handle form submission
    const handleSubmit = async () => {
        console.log('Generating report with answers:', answers);
        setLoading(true);
        setError(null);

        try {
            // Fetch latest competitor data
            const competitors = await fetchCompetitorData();
            
            const requestPayload = {
                company_info: formData,
                report_type: reportType,
                detail_level: detailLevel,
                answers: answers,
                website_data: websiteAnalysis?.website_data,
                competitor_data: competitors  // Add competitor data
            };

            console.group('📊 Generating Report');
            console.log('Request Payload:', requestPayload);

            const response = await fetch(`${SCRAPE_API_BASE_URL}/api/generate-report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestPayload)
            });

            const data = await response.json();
            console.log('Report Response:', data);
            console.groupEnd();

            if (data.status === 'success') {
                setReport(data.data);
                setStep(6);
            } else {
                setError(data.message);
            }
        } catch (err) {
            console.error('Failed to generate report:', err);
            setError('Failed to generate report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Step 1: Select Analysis Detail Level
    const DetailLevelSelection = () => {
        const AnalysisMethodButtons = () => (
            <div className="mt-6 space-y-3">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!detailLevel) {
                            setError('Please select an analysis level first');
                            return;
                        }
                        handleAnalysisClick('scrape');
                    }}
                    className={cn(
                        "w-full px-4 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 transition-all",
                        "bg-purple-600 dark:bg-purple-500",
                        "hover:bg-purple-500 dark:hover:bg-purple-400",
                        "text-white"
                    )}
                >
                    <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        Website Analysis
                    </div>
                </button>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!detailLevel) {
                            setError('Please select an analysis level first');
                            return;
                        }
                        handleAnalysisClick('perplexity');
                    }}
                    className={cn(
                        "w-full px-4 py-2 rounded-lg bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/30 text-pink-300 transition-all",
                        "bg-pink-600 dark:bg-pink-500",
                        "hover:bg-pink-500 dark:hover:bg-pink-400",
                        "text-pink-300"
                    )}
                >
                    <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Perplexity Analysis
                    </div>
                </button>
            </div>
        );

        if (!companyData) {
            return (
                <div className="text-center p-8">
                    <div className="text-red-400 mb-4">
                        Company information is required to proceed.
                    </div>
                    <a 
                        href="/company-form" 
                        className={cn(
                            "px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white",
                            "bg-purple-600 dark:bg-purple-500",
                            "hover:bg-purple-500 dark:hover:bg-purple-400"
                        )}
                    >
                        Set Up Company Information
                    </a>
                </div>
            );
        }

        return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-purple-400 flex items-center">
                <Target className="w-6 h-6 mr-2" />
                Select Analysis Detail Level
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Quick Analysis Card */}
                <div
                    className={cn(
                        "p-6 rounded-xl border-2 cursor-pointer transition-all",
                        detailLevel === 'quick' 
                            ? "border-purple-500 bg-purple-500/10" 
                            : "border-gray-700 hover:border-purple-500/50"
                    )}
                    onClick={() => {
                        console.log('Detail level selected: quick');
                        setDetailLevel('quick');
                    }}
                >
                    <h3 className="text-xl font-semibold text-purple-300">Quick Analysis</h3>
                    <p className="text-gray-400 mt-2">15-20 minutes</p>
                    <ul className="mt-4 space-y-2 text-gray-300">
                        <li>• 2-3 focused questions</li>
                        <li>• Core metrics analysis</li>
                        <li>• Key recommendations</li>
                    </ul>
                        {detailLevel === 'quick' && (
                            <AnalysisMethodButtons />
                        )}
                </div>

                    {/* Detailed Analysis Card */}
                <div
                    className={cn(
                        "p-6 rounded-xl border-2 cursor-pointer transition-all",
                        detailLevel === 'detailed' 
                            ? "border-purple-500 bg-purple-500/10" 
                            : "border-gray-700 hover:border-purple-500/50"
                    )}
                    onClick={() => {
                        console.log('Detail level selected: detailed');
                        setDetailLevel('detailed');
                    }}
                >
                    <h3 className="text-xl font-semibold text-purple-300">Detailed Analysis</h3>
                    <p className="text-gray-400 mt-2">45-60 minutes</p>
                    <ul className="mt-4 space-y-2 text-gray-300">
                        <li>• 4-5 comprehensive questions</li>
                        <li>• In-depth market research</li>
                        <li>• Detailed strategic insights</li>
                    </ul>
                        {detailLevel === 'detailed' && (
                            <AnalysisMethodButtons />
                        )}
                </div>
            </div>
        </div>
    );
    };

    // Step 2: Select Report Type
    const ReportTypeSelection = () => {
        const reportTypes = [
            { 
                id: 'market_analysis', 
                name: 'Market Analysis', 
                desc: 'Overall market position and trends',
                features: [
                    'Market size & growth',
                    'Competitive landscape',
                    'Market opportunities'
                ]
            },
            { 
                id: 'competitor_analysis', 
                name: 'Competitor Analysis', 
                desc: 'Detailed competitive landscape',
                features: [
                    'Competitor strengths',
                    'Market positioning',
                    'Competitive advantages'
                ]
            },
            { 
                id: 'icp_report', 
                name: 'ICP Report', 
                desc: 'Ideal Customer Profile analysis',
                features: [
                    'Customer segments',
                    'Buyer personas',
                    'Customer needs'
                ]
            },
            { 
                id: 'gap_analysis', 
                name: 'Gap Analysis', 
                desc: 'Market opportunities and gaps',
                features: [
                    'Market gaps',
                    'Opportunity areas',
                    'Growth potential'
                ]
            },
            { 
                id: 'market_assessment', 
                name: 'Market Assessment', 
                desc: 'Industry potential',
                features: [
                    'Industry trends',
                    'Market dynamics',
                    'Growth factors'
                ]
            },
            { 
                id: 'impact_assessment', 
                name: 'Impact Assessment', 
                desc: 'Business impact analysis',
                features: [
                    'Business impact',
                    'Risk assessment',
                    'Strategic implications'
                ]
            }
        ];

        // Update handleReportTypeSelect with enhanced logging
        const handleReportTypeSelect = async (type) => {
            setReportType(type.id);
            setLoading(true);
            setError(null);

            try {
                console.group('🚀 Generating Report Analysis');
                console.time('Analysis Duration');

                const competitors = await fetchCompetitorData();
                
                const requestPayload = {
                    report_type: type.id,
                    detail_level: detailLevel,
                    company_name: companyData.company_name,
                    industry: companyData.industry,
                    website_data: companyData.scraped_data,
                    competitor_data: competitors
                };

                logAnalysisStep('Request Payload', {
                    company: requestPayload.company_name,
                    industry: requestPayload.industry,
                    reportType: requestPayload.report_type,
                    detailLevel: requestPayload.detail_level,
                    competitorsCount: competitors.length,
                    hasWebsiteData: !!requestPayload.website_data
                });

                const response = await fetchWithRetry(`${API_CONFIG.baseUrl}/api/generate-questions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestPayload)
                });

                if (!response.ok) {
                    const errorData = await response.text();
                    console.error('❌ API Error Response:', errorData);
                    throw new Error(`Failed to generate questions (${response.status})`);
                }

                const responseData = await response.json();
                logAnalysisStep('API Response', responseData);

                if (responseData.data?.questions && Array.isArray(responseData.data.questions)) {
                    setQuestions(responseData.data.questions);
                    console.log('✅ Questions Generated:', responseData.data.questions.length);
                    setStep(3);
                } else {
                    throw new Error('No questions received from API');
                }

            } catch (err) {
                console.error('❌ Error:', err);
                setError(err.message);
            } finally {
                console.timeEnd('Analysis Duration');
                console.groupEnd();
                setLoading(false);
            }
        };

        // Add Questions component
        const Questions = () => {
            const handleGenerateReport = async () => {
                setLoading(true);
                setError(null);

                try {
                    // Enhanced validation
                    if (!companyData?.company_name || !companyData?.industry) {
                        console.error('Missing company data:', companyData);
                        throw new Error('Company name and industry are required. Please ensure company data is loaded.');
                    }

                    // Log the company data being used
                    console.log('Using company data:', {
                        name: companyData.company_name,
                        industry: companyData.industry,
                        website: companyData.website_url
                    });

                    // Format competitor data properly
                    const formattedCompetitors = competitorData.map(comp => ({
                        company_name: comp.name,
                        website_url: comp.website,
                        industry: comp.analysis?.industry || '',
                        data: comp.websiteData || {},
                        metadata: {
                            scrapeDate: comp.analysis?.scrapeDate || new Date().toISOString(),
                            industry: comp.analysis?.industry || ''
                        }
                    }));

                    // Create request payload with validated structure
                    const requestPayload = {
                        company_name: companyData.company_name,
                        industry: companyData.industry,
                        website_url: companyData.website_url || '',
                        company_info: {
                            data: companyData.scraped_data || {}
                        },
                        report_type: reportType,
                        detail_level: detailLevel,
                        answers: Object.keys(answers).map(key => ({
                            question_id: key,
                            answer: answers[key]
                        })),
                        website_data: websiteAnalysis?.website_data || companyData.scraped_data || {},
                        competitor_data: formattedCompetitors,
                        analysis_parameters: {
                            focus_areas: ['Market Size', 'Competition', 'Growth Trends'],
                            market_region: 'Global',
                            business_model: websiteAnalysis?.analysis?.business_model || 'B2B',
                            target_market: websiteAnalysis?.analysis?.target_market || 'Global Enterprise'
                        }
                    };

                    // Add validation check before sending
                    if (!requestPayload.company_name || !requestPayload.industry) {
                        throw new Error('Company name and industry are required fields');
                    }

                    console.log('Sending request payload:', JSON.stringify(requestPayload, null, 2));

                    const response = await fetch(`${SCRAPE_API_BASE_URL}/api/generate-report`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify(requestPayload)
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        console.error('API Error Response:', data);
                        throw new Error(`Failed to generate report (${response.status}): ${JSON.stringify(data, null, 2)}`);
                    }

                    if (data.status === 'success' && data.data) {
                        setReport(data.data);
                        setStep(4);
                    } else {
                        throw new Error(data.message || 'Failed to generate report');
                    }

                } catch (err) {
                    console.error('Report generation error:', err);
                    setError(err.message);
                } finally {
                    setLoading(false);
                    console.groupEnd();
                }
            };

            // Check if all questions are answered
            const isComplete = questions.every(q => answers[q.id]);

            if (!questions || questions.length === 0) {
                return (
                    <div className="text-center text-gray-400">
                        No questions generated yet.
                    </div>
                );
            }

            return (
                <div className="space-y-6 bg-[#121212]">
                    <h2 className="text-2xl font-bold text-purple-400">Analysis Questions</h2>
                    
                    {/* Company Info Display */}
                    {companyData && (
                        <div className="p-4 bg-gray-800/50 rounded-lg mb-6">
                            <h3 className="text-lg font-semibold text-purple-300 mb-2">Company Information</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <span className="text-purple-300">Name:</span> {companyData.company_name}
                                </div>
                                <div>
                                    <span className="text-purple-300">Industry:</span> {companyData.industry}
                                </div>
                                <div>
                                    <span className="text-purple-300">Website:</span> {companyData.website_url}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Progress indicator */}
                    <div className="mb-6">
                        <div className="flex justify-between text-sm text-gray-400 mb-2">
                            <span>Progress</span>
                            <span>{Object.keys(answers).length}/{questions.length} questions answered</span>
                        </div>
                        <div className={cn(
                            "h-2 rounded-full",
                            "bg-gray-100 dark:bg-gray-800"
                        )}>
                            <div 
                                className={cn(
                                    "h-full rounded-full transition-all",
                                    "bg-gradient-to-r from-purple-600 to-pink-600",
                                    "dark:from-purple-500 dark:to-pink-500"
                                )}
                                style={{ width: `${(Object.keys(answers).length/questions.length) * 100}%` }}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                            {questions.map((q) => (
                            <div 
                                key={q.id}
                                className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                            >
                                <p className="text-gray-200">{q.question}</p>
                                    <textarea
                                    className={cn(
                                        "mt-4 w-full p-3 bg-gray-900/50 rounded-lg border border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500",
                                        "bg-gray-900 dark:bg-gray-100",
                                        "focus:border-purple-500 dark:focus:border-purple-400",
                                        "focus:ring-2 focus:ring-purple-500/10 dark:focus:ring-purple-400/10",
                                        "text-gray-300 dark:text-gray-700"
                                    )}
                                    placeholder="Enter your answer here..."
                                    rows="3"
                                    defaultValue={answers[q.id] || ''}
                                    onBlur={(e) => handleAnswerChange(q.id, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-4 mt-6">
                        <button
                            onClick={() => setStep(2)}
                            className={cn(
                                "px-6 py-3 rounded-lg font-medium border border-gray-700 hover:border-purple-500/50 text-gray-300",
                                "bg-gray-100 dark:bg-gray-800",
                                "hover:bg-gray-200 dark:hover:bg-gray-700",
                                "text-gray-900 dark:text-gray-100"
                            )}
                        >
                            Back
                        </button>
                        <button
                            onClick={handleGenerateReport}
                            disabled={!canGenerateReport() || loading}
                            className={cn(
                                "px-6 py-3 rounded-lg font-medium transition-all duration-200",
                                canGenerateReport() && !loading 
                                    ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
                                    : "bg-gray-600/50 text-gray-400 cursor-not-allowed"
                            )}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating Report...
                                </div>
                            ) : (
                                'Generate Report'
                            )}
                        </button>
                    </div>
                </div>
            );
        };

        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-purple-400">Select Report Type</h2>
                
                {/* Display company info */}
                {companyData && (
                    <div className="p-4 bg-gray-800/50 rounded-lg mb-6">
                        <h3 className="text-lg font-semibold text-purple-300 mb-2">Selected Company</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <span className="text-purple-300">Name:</span> {companyData.company_name}
                            </div>
                            <div>
                                <span className="text-purple-300">Industry:</span> {companyData.industry}
                            </div>
                            <div>
                                <span className="text-purple-300">Website:</span> {companyData.website_url}
                            </div>
                        </div>
                    </div>
                )}

                {/* Report type grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reportTypes.map((type) => (
                        <div
                            key={type.id}
                            className={cn(
                                "p-6 rounded-xl border-2 cursor-pointer transition-all",
                                reportType === type.id 
                                    ? "border-purple-500 bg-purple-500/10" 
                                    : "border-gray-700 hover:border-purple-500/50"
                            )}
                            onClick={() => handleReportTypeSelect(type)}
                        >
                            <h3 className="text-xl font-semibold text-purple-300">{type.name}</h3>
                            <p className="text-gray-400 mt-2">{type.desc}</p>
                            <ul className="mt-4 space-y-2 text-gray-300">
                                {type.features.map((feature, index) => (
                                    <li key={index}>• {feature}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Error display */}
                {error && (
                    <div className={cn(
                        "mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400",
                        "bg-red-500/10 dark:bg-red-500/10",
                        "border-red-200/20 dark:border-red-500/20"
                    )}>
                        {error}
                </div>
                )}

                {/* Loading state */}
                {loading && (
                    <div className="flex justify-center mt-6">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
                    </div>
                )}
            </div>
        );
    };

    // Step 3: Company Information
    const CompanyInfoForm = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-purple-400">Company Information</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-purple-400">
                        Company Name *
                    </label>
                    <input
                        type="text"
                        name="company_name"
                        defaultValue={formData.company_name}
                        onBlur={handleInputChange}
                        className={cn(
                            "w-full p-3 bg-gray-800/50 rounded-lg border border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500",
                            "bg-gray-800 dark:bg-gray-100",
                            "focus:border-purple-500 dark:focus:border-purple-400",
                            "focus:ring-2 focus:ring-purple-500/10 dark:focus:ring-purple-400/10",
                            "text-gray-300 dark:text-gray-700"
                        )}
                        placeholder="Enter company name"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-purple-400">
                        Industry *
                    </label>
                    <input
                        type="text"
                        name="industry"
                        defaultValue={formData.industry}
                        onBlur={handleInputChange}
                        className={cn(
                            "w-full p-3 bg-gray-800/50 rounded-lg border border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500",
                            "bg-gray-800 dark:bg-gray-100",
                            "focus:border-purple-500 dark:focus:border-purple-400",
                            "focus:ring-2 focus:ring-purple-500/10 dark:focus:ring-purple-400/10",
                            "text-gray-300 dark:text-gray-700"
                        )}
                        placeholder="Enter industry"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-purple-400">
                        Website URL
                    </label>
                    <input
                        type="url"
                        name="website_url"
                        defaultValue={formData.website_url}
                        onBlur={handleInputChange}
                        className={cn(
                            "w-full p-3 bg-gray-800/50 rounded-lg border border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500",
                            "bg-gray-800 dark:bg-gray-100",
                            "focus:border-purple-500 dark:focus:border-purple-400",
                            "focus:ring-2 focus:ring-purple-500/10 dark:focus:ring-purple-400/10",
                            "text-gray-300 dark:text-gray-700"
                        )}
                        placeholder="https://example.com"
                    />
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={() => setStep(2)}
                        className={cn(
                            "px-6 py-3 rounded-lg font-medium border border-gray-700 hover:border-purple-500/50 text-gray-300",
                            "bg-gray-100 dark:bg-gray-800",
                            "hover:bg-gray-200 dark:hover:bg-gray-700",
                            "text-gray-900 dark:text-gray-100"
                        )}
                    >
                        Back
                    </button>
                    <button
                        type="submit"
                        className={cn(
                            "flex-1 px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white",
                            "bg-purple-600 dark:bg-purple-500",
                            "hover:bg-purple-500 dark:hover:bg-purple-400"
                        )}
                    >
                        Analyze Company
                    </button>
                </div>
            </form>
        </div>
    );

    // Step 4: Website Analysis Results
    const WebsiteAnalysis = () => {
        const analysis = websiteAnalysis?.analysis;

        const handleAnalysisMethod = async (method) => {
            console.log(`Using ${method} analysis method`);
            setLoading(true);
            setError(null);

            const apiBaseUrl = method === 'scrape' ? SCRAPE_API_BASE_URL : PERPLEXITY_API_BASE_URL;

            try {
                const response = await fetch(`${apiBaseUrl}/api/analyze-website`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        website_url: formData.website_url,
                        company_name: formData.company_name,
                        industry: formData.industry
                    })
                });

                const data = await response.json();
                if (data.status === 'success') {
                    setWebsiteAnalysis(data.data);
                    setAnalysisMethod(method);
                } else {
                    setError(data.message);
                }
            } catch (err) {
                setError(`Failed to analyze website using ${method}. Please try again.`);
            } finally {
                setLoading(false);
            }
        };

        const handleContinue = async () => {
            if (!analysisMethod) {
                setError('Please select an analysis method first');
                return;
            }

            const payload = {
                report_type: reportType,
                detail_level: detailLevel,
                company_name: companyData.company_name,
                industry: companyData.industry,
                website_data: websiteAnalysis?.website_data || {},
                metadata: {
                    analysis_type: analysisMethod,
                    company_info: {
                        name: companyData.company_name,
                        industry: companyData.industry,
                        website: companyData.website_url
                    }
                }
            };
            
            console.log('Generating questions with data:', JSON.stringify(payload, null, 2));
            
            setLoading(true);
            setError(null);

            const apiBaseUrl = analysisMethod === 'scrape' ? SCRAPE_API_BASE_URL : PERPLEXITY_API_BASE_URL;

            try {
                const response = await fetch(`${apiBaseUrl}/api/generate-questions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('API Error Response:', errorText);
                    throw new Error(`Failed to generate questions (${response.status})`);
                }

                const data = await response.json();
                if (data.status === 'success' && data.data?.questions) {
                    setQuestions(data.data.questions);
                    setStep(5);
                } else {
                    throw new Error(data.message || 'Failed to generate questions');
                }
            } catch (err) {
                console.error('Failed to generate questions:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-purple-400">Choose Analysis Method</h2>
                
                {!analysisMethod && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div
                            className="p-6 rounded-xl border-2 border-gray-700 hover:border-purple-500/50 cursor-pointer"
                            onClick={() => handleAnalysisMethod('scrape')}
                        >
                            <h3 className="text-xl font-semibold text-purple-300">Web Scraping Analysis</h3>
                            <p className="text-gray-400 mt-2">Traditional web scraping and analysis</p>
                        </div>

                        <div
                            className="p-6 rounded-xl border-2 border-gray-700 hover:border-purple-500/50 cursor-pointer"
                            onClick={() => handleAnalysisMethod('perplexity')}
                        >
                            <h3 className="text-xl font-semibold text-purple-300">Perplexity Analysis</h3>
                            <p className="text-gray-400 mt-2">Advanced AI-powered analysis</p>
                        </div>
                    </div>
                )}

                {analysis && (
                <div className="bg-gray-800/50 rounded-xl p-6 space-y-4">
                        <div className="mb-4">
                            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm">
                                {analysisMethod === 'scrape' ? 'Web Scraping Analysis' : 'Perplexity Analysis'}
                            </span>
                        </div>
                    <div>
                        <h3 className="text-lg font-semibold text-purple-300">Detected Industry</h3>
                        <p className="text-gray-300">{analysis?.industry}</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-purple-300">Business Model</h3>
                        <p className="text-gray-300">{analysis?.business_model}</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-purple-300">Target Market</h3>
                        <p className="text-gray-300">{analysis?.target_market}</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-purple-300">Products/Services</h3>
                        <ul className="list-disc list-inside text-gray-300">
                            {analysis?.products.map((product, idx) => (
                                <li key={idx}>{product}</li>
                            ))}
                        </ul>
                    </div>
                        
                        {websiteAnalysis?.enhanced_analysis && (
                            <div>
                                <h3 className="text-lg font-semibold text-purple-300">Enhanced Analysis</h3>
                                <p className="text-gray-300">{websiteAnalysis.enhanced_analysis}</p>
                </div>
                        )}
                    </div>
                )}

                <div className="flex gap-4">
                    <button
                        onClick={() => {
                            setAnalysisMethod(null);
                            setWebsiteAnalysis(null);
                            setStep(3);
                        }}
                        className={cn(
                            "px-6 py-3 rounded-lg font-medium border border-gray-700 hover:border-purple-500/50 text-gray-300",
                            "bg-gray-100 dark:bg-gray-800",
                            "hover:bg-gray-200 dark:hover:bg-gray-700",
                            "text-gray-900 dark:text-gray-100"
                        )}
                    >
                        Back
                    </button>
                    {analysis && (
                    <button
                        onClick={handleContinue}
                        className={cn(
                            "flex-1 px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white",
                            "bg-purple-600 dark:bg-purple-500",
                            "hover:bg-purple-500 dark:hover:bg-purple-400"
                        )}
                    >
                        Continue to Questions
                    </button>
                    )}
                </div>
            </div>
        );
    };

    // Step 5: Questions
    const Questions = () => {
        const handleGenerateReport = async () => {
            setLoading(true);
            setError(null);

            try {
                // Enhanced validation
                if (!companyData?.company_name || !companyData?.industry) {
                    console.error('Missing company data:', companyData);
                    throw new Error('Company name and industry are required. Please ensure company data is loaded.');
                }

                // Log the company data being used
                console.log('Using company data:', {
                    name: companyData.company_name,
                    industry: companyData.industry,
                    website: companyData.website_url
                });

                // Format competitor data properly
                const formattedCompetitors = competitorData.map(comp => ({
                    company_name: comp.name,
                    website_url: comp.website,
                    industry: comp.analysis?.industry || '',
                    data: comp.websiteData || {},
                    metadata: {
                        scrapeDate: comp.analysis?.scrapeDate || new Date().toISOString(),
                        industry: comp.analysis?.industry || ''
                    }
                }));

                // Create request payload with validated structure
                const requestPayload = {
                    company_name: companyData.company_name,
                    industry: companyData.industry,
                    website_url: companyData.website_url || '',
                    company_info: {
                        data: companyData.scraped_data || {}
                    },
                    report_type: reportType,
                    detail_level: detailLevel,
                    answers: Object.keys(answers).map(key => ({
                        question_id: key,
                        answer: answers[key]
                    })),
                    website_data: websiteAnalysis?.website_data || companyData.scraped_data || {},
                    competitor_data: formattedCompetitors,
                    analysis_parameters: {
                        focus_areas: ['Market Size', 'Competition', 'Growth Trends'],
                        market_region: 'Global',
                        business_model: websiteAnalysis?.analysis?.business_model || 'B2B',
                        target_market: websiteAnalysis?.analysis?.target_market || 'Global Enterprise'
                    }
                };

                // Add validation check before sending
                if (!requestPayload.company_name || !requestPayload.industry) {
                    throw new Error('Company name and industry are required fields');
                }

                console.log('Sending request payload:', JSON.stringify(requestPayload, null, 2));

                const response = await fetch(`${SCRAPE_API_BASE_URL}/api/generate-report`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(requestPayload)
                });

                const data = await response.json();

                if (!response.ok) {
                    console.error('API Error Response:', data);
                    throw new Error(`Failed to generate report (${response.status}): ${JSON.stringify(data, null, 2)}`);
                }

                if (data.status === 'success' && data.data) {
                    setReport(data.data);
                    setStep(4);
                } else {
                    throw new Error(data.message || 'Failed to generate report');
                }

            } catch (err) {
                console.error('Report generation error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
                console.groupEnd();
            }
        };

        // Check if all questions are answered
        const isComplete = questions.every(q => answers[q.id]);

        if (!questions || questions.length === 0) {
            return (
                <div className="text-center text-gray-400">
                    No questions generated yet.
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-purple-400">Analysis Questions</h2>
                
                {/* Company Info Display */}
                {companyData && (
                    <div className="p-4 bg-gray-800/50 rounded-lg mb-6">
                        <h3 className="text-lg font-semibold text-purple-300 mb-2">Company Information</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <span className="text-purple-300">Name:</span> {companyData.company_name}
                            </div>
                            <div>
                                <span className="text-purple-300">Industry:</span> {companyData.industry}
                            </div>
                            <div>
                                <span className="text-purple-300">Website:</span> {companyData.website_url}
                            </div>
                        </div>
                    </div>
                )}

                {/* Progress indicator */}
                <div className="mb-6">
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                        <span>Progress</span>
                        <span>{Object.keys(answers).length}/{questions.length} questions answered</span>
                    </div>
                    <div className={cn(
                        "h-2 rounded-full",
                        "bg-gray-100 dark:bg-gray-800"
                    )}>
                        <div 
                            className={cn(
                                "h-full rounded-full transition-all",
                                "bg-gradient-to-r from-purple-600 to-pink-600",
                                "dark:from-purple-500 dark:to-pink-500"
                            )}
                            style={{ width: `${(Object.keys(answers).length/questions.length) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                        {questions.map((q) => (
                        <div 
                            key={q.id}
                            className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                        >
                            <p className="text-gray-200">{q.question}</p>
                                <textarea
                                className={cn(
                                    "mt-4 w-full p-3 bg-gray-900/50 rounded-lg border border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500",
                                    "bg-gray-900 dark:bg-gray-100",
                                    "focus:border-purple-500 dark:focus:border-purple-400",
                                    "focus:ring-2 focus:ring-purple-500/10 dark:focus:ring-purple-400/10",
                                    "text-gray-300 dark:text-gray-700"
                                )}
                                placeholder="Enter your answer here..."
                                rows="3"
                                    defaultValue={answers[q.id] || ''}
                                    onBlur={(e) => handleAnswerChange(q.id, e.target.value)}
                                />
                            </div>
                        ))}
                </div>

                <div className="flex justify-end gap-4 mt-6">
                    <button
                        onClick={() => setStep(2)}
                        className={cn(
                            "px-6 py-3 rounded-lg font-medium border border-gray-700 hover:border-purple-500/50 text-gray-300",
                            "bg-gray-100 dark:bg-gray-800",
                            "hover:bg-gray-200 dark:hover:bg-gray-700",
                            "text-gray-900 dark:text-gray-100"
                        )}
                    >
                        Back
                    </button>
                    <button
                        onClick={handleGenerateReport}
                        disabled={!canGenerateReport() || loading}
                        className={cn(
                            "px-6 py-3 rounded-lg font-medium transition-all duration-200",
                            canGenerateReport() && !loading 
                                ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
                                : "bg-gray-600/50 text-gray-400 cursor-not-allowed"
                        )}
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating Report...
                            </div>
                        ) : (
                            'Generate Report'
                        )}
                    </button>
                </div>
            </div>
        );
    };

    // Step 6: Report
    const Report = () => {
        const downloadPDF = () => {
            console.log('Downloading PDF:', report.report_file);
            window.open(report.report_file, '_blank');
        };

        // Function to convert markdown to styled HTML
        const formatMarkdown = (content) => {
            if (!content) return '';

            // Add custom styling classes
            return content
                // Headers
                .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mb-6 text-purple-400 border-b border-purple-500/20 pb-2">$1</h1>')
                .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-8 mb-4 text-purple-300">$1</h2>')
                .replace(/^### (.*$)/gm, '<h3 class="text-xl font-semibold mt-6 mb-3 text-purple-200">$1</h3>')
                
                // Lists
                .replace(/^\* (.*$)/gm, '<li class="ml-4 mb-2 text-gray-300">• $1</li>')
                .replace(/^- (.*$)/gm, '<li class="ml-4 mb-2 text-gray-300">• $1</li>')
                .replace(/^(\d+\.) (.*$)/gm, '<li class="ml-4 mb-2 text-gray-300"><span class="text-purple-400">$1</span> $2</li>')
                
                // Tables
                .replace(/\|/g, '<div class="table-cell px-4 py-2 border-b border-gray-700">')
                .replace(/^-+$/gm, '')
                
                // Emphasis
                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-purple-300">$1</strong>')
                .replace(/\*(.*?)\*/g, '<em class="text-purple-200">$1</em>')
                
                // Sections
                .replace(/^#### (.*$)/gm, '<h4 class="text-lg font-semibold mt-4 mb-2 text-purple-200">$1</h4>')
                
                // Quotes
                .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-purple-500 pl-4 my-4 text-gray-400 italic">$1</blockquote>')
                
                // Code blocks
                .replace(/```(.*?)```/gs, '<pre class="bg-gray-800 rounded-lg p-4 my-4 overflow-x-auto text-gray-300">$1</pre>')
                
                // Horizontal rules
                .replace(/---$/gm, '<hr class="my-8 border-t border-gray-700">')
                
                // Paragraphs
                .replace(/^(?!<[hl]|<li|<block|<pre|<hr)(.*$)/gm, '<p class="text-gray-300 mb-4 leading-relaxed">$1</p>');
        };

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-purple-400">Analysis Report</h2>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                console.log('Copying report content to clipboard');
                                navigator.clipboard.writeText(report?.report_content);
                            }}
                            className={cn(
                                "px-4 py-2 rounded-lg font-medium bg-gray-700 hover:bg-gray-600 text-white flex items-center gap-2",
                                "bg-gray-100 dark:bg-gray-800",
                                "hover:bg-gray-200 dark:hover:bg-gray-700",
                                "text-gray-900 dark:text-gray-100"
                            )}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                            Copy
                        </button>
                        <button
                            onClick={downloadPDF}
                            className={cn(
                                "px-4 py-2 rounded-lg font-medium bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2",
                                "bg-purple-600 dark:bg-purple-500",
                                "hover:bg-purple-500 dark:hover:bg-purple-400"
                            )}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download PDF
                        </button>
                    </div>
                </div>

                <div className="bg-gray-800/50 rounded-xl p-8">
                    {/* Report Metadata */}
                    <div className="mb-8 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-sm font-medium text-purple-300">Company</h3>
                                <p className="text-gray-300">{formData.company_name}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-purple-300">Industry</h3>
                                <p className="text-gray-300">{formData.industry}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-purple-300">Report Type</h3>
                                <p className="text-gray-300">{reportType.replace('_', ' ').toUpperCase()}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-purple-300">Analysis Level</h3>
                                <p className="text-gray-300">{detailLevel.toUpperCase()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Report Content */}
                    <div 
                        className="report-content"
                        dangerouslySetInnerHTML={{ __html: formatMarkdown(report?.report_content) }}
                    />
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-4">
                    <button
                        onClick={() => setStep(5)}
                        className={cn(
                            "px-6 py-3 rounded-lg font-medium border border-gray-700 hover:border-purple-500/50 text-gray-300",
                            "bg-gray-100 dark:bg-gray-800",
                            "hover:bg-gray-200 dark:hover:bg-gray-700",
                            "text-gray-900 dark:text-gray-100"
                        )}
                    >
                        Back
                    </button>
                    <button
                        onClick={() => {
                            console.log('Starting new analysis - resetting all states');
                            setStep(1);
                            setDetailLevel(null);
                            setReportType(null);
                            setFormData({
                                company_name: '',
                                industry: '',
                                website_url: '',
                                focus_areas: []
                            });
                            setWebsiteAnalysis(null);
                            setQuestions([]);
                            setAnswers({});
                            setReport(null);
                        }}
                        className={cn(
                            "flex-1 px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white",
                            "bg-purple-600 dark:bg-purple-500",
                            "hover:bg-purple-500 dark:hover:bg-purple-400"
                        )}
                    >
                        Start New Analysis
                    </button>
                </div>
            </div>
        );
    };

    // Add visual feedback for competitor data in the UI
    const CompetitorStatus = () => (
        <div className={cn(
            "space-y-2",
            "text-gray-700 dark:text-gray-300"
        )}>
            <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-2">
                Competitor Data Status
            </h3>
            <div className="space-y-2">
                <p>
                    {competitorData.length > 0 ? (
                        <>
                            <span className="text-green-600 dark:text-green-400">✓</span> {competitorData.length} competitors loaded
                        </>
                    ) : (
                        <>
                            <span className="text-yellow-600 dark:text-yellow-400">⚠</span> No competitor data available
                        </>
                    )}
                </p>
                {competitorData.length > 0 && (
                    <div className="space-y-1 text-sm">
                        <p className="font-medium">Companies:</p>
                        <div className="max-h-32 overflow-y-auto">
                            {competitorData.map((comp, index) => (
                                <div key={comp.id} className="flex items-center gap-2 py-1">
                                    <span className="text-xs text-gray-500">
                                        {index + 1}.
                                    </span>
                                    <span className="font-medium">
                                        {comp.name}
                                    </span>
                                    {comp.analysis?.industry && (
                                        <span className="text-xs text-gray-500">
                                            ({comp.analysis.industry})
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className={cn(
            "min-h-screen",
            "bg-white dark:bg-[#121212]",
            "text-gray-900 dark:text-gray-100"
        )}>
            {/* Modern Header */}
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 max-w-screen-2xl items-center">
                    <div className="mr-4 flex">
                        <a className="mr-6 flex items-center space-x-2" href="/">
                            <span className="font-bold text-xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Professional Analysis
                            </span>
                        </a>
                    </div>
                    <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                        <button
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 py-2 w-9 px-0"
                        >
                            <Settings className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="container max-w-screen-lg mx-auto px-4 py-8">
                {/* Company Info Card */}
                {companyData && (
                    <div className={cn(
                        "mb-8 p-4 rounded-lg border backdrop-blur-sm",
                        "bg-gray-50/30 dark:bg-gray-800/30",
                        "border-gray-200/50 dark:border-gray-700/50"
                    )}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                                Company Information
                            </h3>
                            <span className={cn(
                                "px-2 py-1 text-xs rounded-full",
                                "bg-purple-100 dark:bg-purple-900/30",
                                "text-purple-700 dark:text-purple-300"
                            )}>
                                Active Analysis
                            </span>
                        </div>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">Company</label>
                                <p className="text-gray-200">{companyData.company_name}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">Industry</label>
                                <p className="text-gray-200">{companyData.industry}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">Website</label>
                                <a href={companyData.website_url} 
                                   target="_blank" 
                                   rel="noopener noreferrer"
                                   className={cn(
                                       "text-blue-400 hover:text-blue-300",
                                       "text-gray-200 dark:text-gray-700"
                                   )}
                                >
                                    {companyData.website_url}
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex justify-between text-sm mb-2">
                        {['Detail Level', 'Report Type', 'Questions', 'Report'].map((label, idx) => (
                            <div 
                                key={label}
                                className={cn(
                                    "flex items-center space-x-2",
                                    idx + 1 === step 
                                        ? "text-purple-600 dark:text-purple-400" 
                                        : "text-gray-500 dark:text-gray-500"
                                )}
                            >
                                {idx + 1 === 1 && <Target className="w-4 h-4" />}
                                {idx + 1 === 2 && <ChartBar className="w-4 h-4" />}
                                {idx + 1 === 3 && <Search className="w-4 h-4" />}
                                {idx + 1 === 4 && <BarChart3 className="w-4 h-4" />}
                                <span>{label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                        <div 
                            className={cn(
                                "h-full rounded-full transition-all duration-300",
                                "bg-gradient-to-r from-purple-600 to-pink-600"
                            )}
                            style={{ width: `${(step/4) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className={cn(
                        "mb-6 p-4 rounded-lg",
                        "bg-red-50/10 dark:bg-red-900/20",
                        "border border-red-200/20 dark:border-red-700/20",
                        "text-red-700 dark:text-red-300"
                    )}>
                        <div className="flex items-center space-x-2 text-red-400">
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <div className={cn(
                    "rounded-lg border backdrop-blur-sm",
                    "bg-gray-50/30 dark:bg-gray-800/30",
                    "border-gray-200/50 dark:border-gray-700/50"
                )}>
                    {!loading ? (
                        <div className="p-6">
                            {step === 1 && <DetailLevelSelection />}
                            {step === 2 && <ReportTypeSelection />}
                            {step === 3 && <Questions />}
                            {step === 4 && <Report />}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center py-12">
                            <div className="flex flex-col items-center space-y-4">
                                <Loader2 className="w-8 h-8 animate-spin text-purple-600 dark:text-purple-400" />
                                <p className="text-gray-600 dark:text-gray-400">Processing your request...</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Competitor Status */}
            <div className={cn(
                "fixed bottom-4 right-4",
                "bg-white/80 dark:bg-gray-800/80",
                "backdrop-blur-sm rounded-lg shadow-lg",
                "p-4 border border-gray-200/50 dark:border-gray-700/50"
            )}>
                <CompetitorStatus />
            </div>
        </div>
    );
}