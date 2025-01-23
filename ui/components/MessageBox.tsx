'use client';

/* eslint-disable @next/next/no-img-element */
import React, { MutableRefObject, useEffect, useState } from 'react';
import { Message } from './ChatWindow';
import { cn } from '@/lib/utils';
import {
  BookCopy,
  Disc3,
  Volume2,
  StopCircle,
  Layers3,
  Plus,
  FileDown,
} from 'lucide-react';
import Markdown from 'markdown-to-jsx';
import jsPDF from 'jspdf';
import Copy from './MessageActions/Copy';
import Rewrite from './MessageActions/Rewrite';
import MessageSources from './MessageSources';
import SearchImages from './SearchImages';
import SearchVideos from './SearchVideos';
import { useSpeech } from 'react-text-to-speech';

const stripMarkdownAndCitations = (text: string) => {
  let cleanText = text.replace(/[#*_~`]/g, '');
  cleanText = cleanText.replace(/\[\d+\]/g, '');
  return cleanText;
};

const MessageBox = ({
  message,
  messageIndex,
  history,
  loading,
  dividerRef,
  isLast,
  rewrite,
  sendMessage,
}: {
  message: Message;
  messageIndex: number;
  history: Message[];
  loading: boolean;
  dividerRef?: MutableRefObject<HTMLDivElement | null>;
  isLast: boolean;
  rewrite: (messageId: string) => void;
  sendMessage: (message: string) => void;
}) => {
  const [parsedMessage, setParsedMessage] = useState(message.content);
  const [speechMessage, setSpeechMessage] = useState(message.content);

  useEffect(() => {
    const regex = /\[(\d+)\]/g;

    if (
      message.role === 'assistant' &&
      message?.sources &&
      message.sources.length > 0
    ) {
      return setParsedMessage(
        message.content.replace(
          regex,
          (_, number) =>
            `<a href="${message.sources?.[number - 1]?.metadata?.url}" target="_blank" className="bg-light-secondary dark:bg-dark-secondary px-1 rounded ml-1 no-underline text-xs text-black/70 dark:text-white/70 relative">${number}</a>`,
        ),
      );
    }

    setSpeechMessage(message.content.replace(regex, ''));
    setParsedMessage(message.content);
  }, [message.content, message.sources, message.role]);

  const { speechStatus, start, stop } = useSpeech({ text: speechMessage });

  const exportMessageAsPDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const lineHeight = 7;
    
    pdf.setFontSize(16);
    pdf.text('Chat Message', margin, margin);
    
    pdf.setFontSize(10);
    const timestamp = new Date().toLocaleString();
    pdf.text(`Generated on: ${timestamp}`, margin, margin + lineHeight);
    
    pdf.setFontSize(12);
    pdf.text(`Role: ${message.role}`, margin, margin + lineHeight * 3);
    
    pdf.setFontSize(11);
    const cleanContent = stripMarkdownAndCitations(message.content);
    const splitContent = pdf.splitTextToSize(cleanContent, pageWidth - margin * 2);
    pdf.text(splitContent, margin, margin + lineHeight * 5);
    
    if (message.sources && message.sources.length > 0) {
      let yPosition = margin + lineHeight * (7 + splitContent.length);
      
      pdf.setFontSize(12);
      pdf.text('Sources:', margin, yPosition);
      
      pdf.setFontSize(10);
      message.sources.forEach((source, index) => {
        yPosition += lineHeight;
        if (yPosition > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        const sourceText = `${index + 1}. ${source.metadata?.url || 'N/A'}`;
        pdf.text(sourceText, margin, yPosition);
      });
    }
    
    pdf.save(`message-${message.messageId}.pdf`);
  };

  const exportChatAsPDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const lineHeight = 7;
    let yPosition = margin;
    
    pdf.setFontSize(16);
    pdf.text('Chat History', margin, yPosition);
    yPosition += lineHeight * 2;
    
    pdf.setFontSize(10);
    const timestamp = new Date().toLocaleString();
    pdf.text(`Generated on: ${timestamp}`, margin, yPosition);
    yPosition += lineHeight * 2;
    
    history.forEach((msg, index) => {
      if (yPosition > pageHeight - margin * 2) {
        pdf.addPage();
        yPosition = margin;
      }
      
      pdf.setFontSize(12);
      pdf.text(`Message ${index + 1} (${msg.role})`, margin, yPosition);
      yPosition += lineHeight * 1.5;
      
      pdf.setFontSize(11);
      const cleanContent = stripMarkdownAndCitations(msg.content);
      const splitContent = pdf.splitTextToSize(cleanContent, pageWidth - margin * 2);
      pdf.text(splitContent, margin, yPosition);
      yPosition += lineHeight * (splitContent.length + 1);
      
      if (msg.sources && msg.sources.length > 0) {
        pdf.setFontSize(10);
        pdf.text('Sources:', margin, yPosition);
        yPosition += lineHeight;
        
        msg.sources.forEach((source, sourceIndex) => {
          if (yPosition > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          const sourceText = `${sourceIndex + 1}. ${source.metadata?.url || 'N/A'}`;
          pdf.text(sourceText, margin, yPosition);
          yPosition += lineHeight;
        });
      }
      
      yPosition += lineHeight * 2;
    });
    
    pdf.save('chat-history.pdf');
  };

  return (
    <div>
      {message.role === 'user' && (
        <div className={cn('w-full', messageIndex === 0 ? 'pt-16' : 'pt-8')}>
          <h2 className="text-black dark:text-white font-medium text-3xl lg:w-9/12">
            {message.content}
          </h2>
        </div>
      )}

      {message.role === 'assistant' && (
        <div className="flex flex-col space-y-9 lg:space-y-0 lg:flex-row lg:justify-between lg:space-x-9">
          <div
            ref={dividerRef}
            className="flex flex-col space-y-6 w-full lg:w-9/12"
          >
            {message.sources && message.sources.length > 0 && (
              <div className="flex flex-col space-y-2">
                <div className="flex flex-row items-center space-x-2">
                  <BookCopy className="text-black dark:text-white" size={20} />
                  <h3 className="text-black dark:text-white font-medium text-xl">
                    Sources
                  </h3>
                </div>
                <MessageSources sources={message.sources} />
              </div>
            )}
            <div className="flex flex-col space-y-2">
              <div className="flex flex-row items-center space-x-2">
                <Disc3
                  className={cn(
                    'text-black dark:text-white',
                    isLast && loading ? 'animate-spin' : 'animate-none',
                  )}
                  size={20}
                />
                <h3 className="text-black dark:text-white font-medium text-xl">
                  Answer
                </h3>
              </div>
              <Markdown
                className={cn(
                  'prose prose-h1:mb-3 prose-h2:mb-2 prose-h2:mt-6 prose-h2:font-[800] prose-h3:mt-4 prose-h3:mb-1.5 prose-h3:font-[600] dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 font-[400]',
                  'max-w-none break-words text-black dark:text-white',
                )}
              >
                {parsedMessage}
              </Markdown>
              {loading && isLast ? null : (
                <div className="flex flex-row items-center justify-between w-full text-black dark:text-white py-4 -mx-2">
                  <div className="flex flex-row items-center space-x-1">
                    <Rewrite rewrite={rewrite} messageId={message.messageId} />
                  </div>
                  <div className="flex flex-row items-center space-x-1">
                    <Copy initialMessage={message.content} message={message} />
                    <button
                      onClick={() => {
                        if (speechStatus === 'started') {
                          stop();
                        } else {
                          start();
                        }
                      }}
                      className="p-2 text-black/70 dark:text-white/70 rounded-xl hover:bg-light-secondary dark:hover:bg-dark-secondary transition duration-200 hover:text-black dark:hover:text-white"
                    >
                      {speechStatus === 'started' ? (
                        <StopCircle size={18} />
                      ) : (
                        <Volume2 size={18} />
                      )}
                    </button>
                    <button
                      onClick={exportMessageAsPDF}
                      title="Export message as PDF"
                      className="p-2 text-black/70 dark:text-white/70 rounded-xl hover:bg-light-secondary dark:hover:bg-dark-secondary transition duration-200 hover:text-black dark:hover:text-white"
                    >
                      <FileDown size={18} />
                    </button>
                    {isLast && (
                      <button
                        onClick={exportChatAsPDF}
                        title="Export entire chat as PDF"
                        className="p-2 text-black/70 dark:text-white/70 rounded-xl hover:bg-light-secondary dark:hover:bg-dark-secondary transition duration-200 hover:text-black dark:hover:text-white flex items-center"
                      >
                        <FileDown size={18} />
                        <span className="ml-1 text-xs">All</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
              {isLast &&
                message.suggestions &&
                message.suggestions.length > 0 &&
                message.role === 'assistant' &&
                !loading && (
                  <>
                    <div className="h-px w-full bg-light-secondary dark:bg-dark-secondary" />
                    <div className="flex flex-col space-y-3 text-black dark:text-white">
                      <div className="flex flex-row items-center space-x-2 mt-4">
                        <Layers3 />
                        <h3 className="text-xl font-medium">Related</h3>
                      </div>
                      <div className="flex flex-col space-y-3">
                        {message.suggestions.map((suggestion, i) => (
                          <div
                            className="flex flex-col space-y-3 text-sm"
                            key={i}
                          >
                            <div className="h-px w-full bg-light-secondary dark:bg-dark-secondary" />
                            <div
                              onClick={() => {
                                sendMessage(suggestion);
                              }}
                              className="cursor-pointer flex flex-row justify-between font-medium space-x-2 items-center"
                            >
                              <p className="transition duration-200 hover:text-[#24A0ED]">
                                {suggestion}
                              </p>
                              <Plus
                                size={20}
                                className="text-[#24A0ED] flex-shrink-0"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
            </div>
          </div>
          <div className="lg:sticky lg:top-20 flex flex-col items-center space-y-3 w-full lg:w-3/12 z-30 h-full pb-4">
            <SearchImages
              query={history[messageIndex - 1].content}
              chatHistory={history.slice(0, messageIndex - 1)}
            />
            <SearchVideos
              chatHistory={history.slice(0, messageIndex - 1)}
              query={history[messageIndex - 1].content}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageBox;
