"use client";

import { useState, useCallback, memo, useRef } from 'react';

const API_BASE_URL = 'https://varun324242-sjuu.hf.space/api';

// Add large title text at the top
const PageTitle = () => (
    <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white">
            Professional Analysis Mode
        </h1>
        <p className="text-sm mt-2 text-white/60">
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
            <label className="block text-sm font-medium text-white/80">
                {label} {required && '*'}
            </label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={handleChange}
                className="w-full p-2.5 bg-light-secondary dark:bg-dark-secondary text-black dark:text-white rounded-lg border border-light-100 dark:border-dark-200 focus:border-white/30 focus:ring-2 focus:ring-white/10"
                placeholder={placeholder}
                required={required}
            />
        </div>
    );
});
// Add display name
InputField.displayName = 'InputField';

export default function ProModeContent() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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

    // Handle input changes with debounce
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle text area changes
    const handleAnswerChange = (questionId, value) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Form submitted with data:', formData);
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/analyze-website`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.status === 'success') {
                setWebsiteAnalysis(data.data);
                setStep(4);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to analyze website. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Step 1: Select Analysis Detail Level
    const DetailLevelSelection = () => (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Select Analysis Detail Level</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                    className={`p-6 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-[1.02]
                        ${detailLevel === 'quick' 
                            ? 'border-white/20 bg-light-secondary dark:bg-dark-secondary' 
                            : 'border-light-100 dark:border-dark-200 hover:border-white/30'}`}
                    onClick={() => setDetailLevel('quick')}
                >
                    <h3 className="text-lg font-medium text-white">Quick Analysis</h3>
                    <p className="text-sm text-white/60 mt-1">15-20 minutes</p>
                    <ul className="mt-3 space-y-1.5 text-sm text-white/70">
                        <li>• 2-3 focused questions</li>
                        <li>• Core metrics analysis</li>
                        <li>• Key recommendations</li>
                    </ul>
                </div>

                <div
                    className={`p-6 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-[1.02]
                        ${detailLevel === 'detailed' 
                            ? 'border-white/20 bg-light-secondary dark:bg-dark-secondary' 
                            : 'border-light-100 dark:border-dark-200 hover:border-white/30'}`}
                    onClick={() => setDetailLevel('detailed')}
                >
                    <h3 className="text-lg font-medium text-white">Detailed Analysis</h3>
                    <p className="text-sm text-white/60 mt-1">45-60 minutes</p>
                    <ul className="mt-3 space-y-1.5 text-sm text-white/70">
                        <li>• 4-5 comprehensive questions</li>
                        <li>• In-depth market research</li>
                        <li>• Detailed strategic insights</li>
                    </ul>
                </div>
            </div>

            <button
                onClick={() => setStep(2)}
                disabled={!detailLevel}
                className={`w-full mt-4 px-4 py-2.5 rounded-lg font-medium transition-all
                    ${detailLevel 
                        ? 'bg-white/90 text-black hover:bg-white' 
                        : 'bg-light-secondary dark:bg-dark-secondary text-black/40 dark:text-white/40 cursor-not-allowed'}`}
            >
                Continue
            </button>
        </div>
    );

    // Step 2: Select Report Type
    const ReportTypeSelection = () => {
        const reportTypes = [
            { id: 'market_analysis', name: 'Market Analysis', desc: 'Overall market position and trends' },
            { id: 'competitor_analysis', name: 'Competitor Analysis', desc: 'Detailed competitive landscape' },
            { id: 'icp_report', name: 'ICP Report', desc: 'Ideal Customer Profile analysis' },
            { id: 'gap_analysis', name: 'Gap Analysis', desc: 'Market opportunities and gaps' },
            { id: 'market_assessment', name: 'Market Assessment', desc: 'Industry potential' },
            { id: 'impact_assessment', name: 'Impact Assessment', desc: 'Business impact analysis' }
        ];

        return (
            <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white">Select Report Type</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reportTypes.map((type) => (
                        <div
                            key={type.id}
                            className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-[1.02]
                                ${reportType === type.id 
                                    ? 'border-white/20 bg-light-secondary dark:bg-dark-secondary' 
                                    : 'border-light-100 dark:border-dark-200 hover:border-white/30'}`}
                            onClick={() => setReportType(type.id)}
                        >
                            <h3 className="text-base font-medium text-white">{type.name}</h3>
                            <p className="text-sm text-white/60 mt-1">{type.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setStep(1)}
                        className="px-4 py-2.5 rounded-lg font-medium border border-white/10 hover:border-white/30 text-white"
                    >
                        Back
                    </button>
                    <button
                        onClick={() => setStep(3)}
                        disabled={!reportType}
                        className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all
                            ${reportType 
                                ? 'bg-white/90 text-black hover:bg-white' 
                                : 'bg-light-secondary dark:bg-dark-secondary text-black/40 dark:text-white/40 cursor-not-allowed'}`}
                    >
                        Continue
                    </button>
                </div>
            </div>
        );
    };

    // Step 3: Company Information
    const CompanyInfoForm = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Company Information</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-white">
                        Company Name *
                    </label>
                    <input
                        type="text"
                        name="company_name"
                        defaultValue={formData.company_name}
                        onBlur={handleInputChange}
                        className="w-full p-3 bg-light-secondary dark:bg-dark-secondary rounded-lg border border-light-100 dark:border-dark-200 focus:border-white/30 focus:ring-1 focus:ring-white/30"
                        placeholder="Enter company name"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-white">
                        Industry *
                    </label>
                    <input
                        type="text"
                        name="industry"
                        defaultValue={formData.industry}
                        onBlur={handleInputChange}
                        className="w-full p-3 bg-light-secondary dark:bg-dark-secondary rounded-lg border border-light-100 dark:border-dark-200 focus:border-white/30 focus:ring-1 focus:ring-white/30"
                        placeholder="Enter industry"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-white">
                        Website URL
                    </label>
                    <input
                        type="url"
                        name="website_url"
                        defaultValue={formData.website_url}
                        onBlur={handleInputChange}
                        className="w-full p-3 bg-light-secondary dark:bg-dark-secondary rounded-lg border border-light-100 dark:border-dark-200 focus:border-white/30 focus:ring-1 focus:ring-white/30"
                        placeholder="https://example.com"
                    />
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="px-6 py-3 rounded-lg font-medium border border-white/10 hover:border-white/30 text-white"
                    >
                        Back
                    </button>
                    <button
                        type="submit"
                        className="flex-1 px-6 py-3 rounded-lg font-medium bg-white hover:bg-white/90 text-black"
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

        const handleContinue = async () => {
            console.log('Generating questions with data:', {
                report_type: reportType,
                detail_level: detailLevel,
                company_name: formData.company_name,
                industry: formData.industry,
                website_data: websiteAnalysis.website_data
            });
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`${API_BASE_URL}/generate-questions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        report_type: reportType,
                        detail_level: detailLevel,
                        company_name: formData.company_name,
                        industry: formData.industry,
                        website_data: websiteAnalysis.website_data
                    })
                });

                const data = await response.json();
                if (data.status === 'success') {
                    setQuestions(data.data.questions);
                    setStep(5);
                } else {
                    setError(data.message);
                }
            } catch (err) {
                setError('Failed to generate questions. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Website Analysis Results</h2>
                
                <div className="bg-light-secondary dark:bg-dark-secondary rounded-xl p-6 space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Detected Industry</h3>
                        <p className="text-white/70">{analysis?.industry}</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Business Model</h3>
                        <p className="text-white/70">{analysis?.business_model}</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Target Market</h3>
                        <p className="text-white/70">{analysis?.target_market}</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Products/Services</h3>
                        <ul className="list-disc list-inside text-white/70">
                            {analysis?.products.map((product, idx) => (
                                <li key={idx}>{product}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => setStep(3)}
                        className="px-6 py-3 rounded-lg font-medium border border-white/10 hover:border-white/30 text-white"
                    >
                        Back
                    </button>
                    <button
                        onClick={handleContinue}
                        className="flex-1 px-6 py-3 rounded-lg font-medium bg-white hover:bg-white/90 text-black"
                    >
                        Continue to Questions
                    </button>
                </div>
            </div>
        );
    };

    // Step 5: Questions
    const Questions = memo(() => {
        const handleSubmit = async () => {
            console.log('Generating report with answers:', answers);
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`${API_BASE_URL}/generate-report`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        company_info: formData,
                        report_type: reportType,
                        detail_level: detailLevel,
                        answers: answers,
                        website_data: websiteAnalysis?.website_data
                    })
                });

                const data = await response.json();
                if (data.status === 'success') {
                    setReport(data.data);
                    setStep(6);
                } else {
                    setError(data.message);
                }
            } catch (err) {
                setError('Failed to generate report. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Analysis Questions</h2>
                <div className="bg-light-secondary dark:bg-dark-secondary rounded-xl p-6">
                    <div className="space-y-6">
                        {questions.map((q) => (
                            <div key={q.id} className="space-y-2">
                                <label className="block text-sm font-medium text-white">
                                    {q.question}
                                </label>
                                <textarea
                                    defaultValue={answers[q.id] || ''}
                                    onBlur={(e) => handleAnswerChange(q.id, e.target.value)}
                                    className="w-full p-3 bg-light-secondary dark:bg-dark-secondary rounded-lg border border-light-100 dark:border-dark-200 focus:border-white/30 focus:ring-1 focus:ring-white/30 min-h-[100px] text-white"
                                    placeholder="Enter your answer..."
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => setStep(4)}
                        className="px-6 py-3 rounded-lg font-medium border border-white/10 hover:border-white/30 text-white"
                    >
                        Back
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={Object.keys(answers).length !== questions.length}
                        className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all
                            ${Object.keys(answers).length === questions.length
                                ? 'bg-white/90 text-black hover:bg-white'
                                : 'bg-light-secondary dark:bg-dark-secondary text-black/40 dark:text-white/40 cursor-not-allowed'}`}
                    >
                        Generate Report
                    </button>
                </div>
            </div>
        );
    });
    // Add display name
    Questions.displayName = 'Questions';

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
                .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mb-6 text-white border-b border-white/20 pb-2">$1</h1>')
                .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-8 mb-4 text-white">$1</h2>')
                .replace(/^### (.*$)/gm, '<h3 class="text-xl font-semibold mt-6 mb-3 text-white/90">$1</h3>')
                
                // Lists
                .replace(/^\* (.*$)/gm, '<li class="ml-4 mb-2 text-white/70">• $1</li>')
                .replace(/^- (.*$)/gm, '<li class="ml-4 mb-2 text-white/70">• $1</li>')
                .replace(/^(\d+\.) (.*$)/gm, '<li class="ml-4 mb-2 text-white/70"><span class="text-white">$1</span> $2</li>')
                
                // Tables
                .replace(/\|/g, '<div class="table-cell px-4 py-2 border-b border-white/10">')
                .replace(/^-+$/gm, '')
                
                // Emphasis
                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                .replace(/\*(.*?)\*/g, '<em class="text-white/90">$1</em>')
                
                // Sections
                .replace(/^#### (.*$)/gm, '<h4 class="text-lg font-semibold mt-4 mb-2 text-white">$1</h4>')
                
                // Quotes
                .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-white/20 pl-4 my-4 text-white/60 italic">$1</blockquote>')
                
                // Code blocks
                .replace(/```(.*?)```/gs, '<pre class="bg-light-secondary dark:bg-dark-secondary rounded-lg p-4 my-4 overflow-x-auto text-white/70">$1</pre>')
                
                // Horizontal rules
                .replace(/^---$/gm, '<hr class="my-8 border-t border-white/10">')
                
                // Paragraphs
                .replace(/^(?!<[hl]|<li|<block|<pre|<hr)(.*$)/gm, '<p class="text-white/70 mb-4 leading-relaxed">$1</p>');
        };

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Analysis Report</h2>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                console.log('Copying report content to clipboard');
                                navigator.clipboard.writeText(report?.report_content);
                            }}
                            className="px-4 py-2 rounded-lg font-medium bg-white/10 hover:bg-white/20 text-white flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                            Copy
                        </button>
                        <button
                            onClick={downloadPDF}
                            className="px-4 py-2 rounded-lg font-medium bg-white hover:bg-white/90 text-black flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download PDF
                        </button>
                    </div>
                </div>

                <div className="bg-light-secondary dark:bg-dark-secondary rounded-xl p-8">
                    {/* Report Metadata */}
                    <div className="mb-8 p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-sm font-medium text-white">Company</h3>
                                <p className="text-white/70">{formData.company_name}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-white">Industry</h3>
                                <p className="text-white/70">{formData.industry}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-white">Report Type</h3>
                                <p className="text-white/70">{reportType.replace('_', ' ').toUpperCase()}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-white">Analysis Level</h3>
                                <p className="text-white/70">{detailLevel.toUpperCase()}</p>
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
                        className="px-6 py-3 rounded-lg font-medium border border-white/10 hover:border-white/30 text-white"
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
                        className="flex-1 px-6 py-3 rounded-lg font-medium bg-white hover:bg-white/90 text-black"
                    >
                        Start New Analysis
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-light-primary dark:bg-dark-primary text-black dark:text-white">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <PageTitle />
                
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between text-xs mb-2">
                        {['Detail Level', 'Report Type', 'Company Info', 'Analysis', 'Questions', 'Report'].map((label, idx) => (
                            <div 
                                key={label}
                                className={`${idx + 1 === step ? 'text-white' : 'text-white/40'}`}
                            >
                                {label}
                            </div>
                        ))}
                    </div>
                    <div className="h-1.5 bg-light-secondary dark:bg-dark-secondary rounded-full">
                        <div 
                            className="h-full bg-white/90 rounded-full transition-all duration-300 ease-in-out"
                            style={{ width: `${(step/6) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                        {error}
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/80 border-t-transparent" />
                    </div>
                )}

                {/* Steps */}
                {!loading && (
                    <>
                        {step === 1 && <DetailLevelSelection />}
                        {step === 2 && <ReportTypeSelection />}
                        {step === 3 && <CompanyInfoForm />}
                        {step === 4 && <WebsiteAnalysis />}
                        {step === 5 && <Questions />}
                        {step === 6 && <Report />}
                    </>
                )}
            </div>
        </div>
    );
}