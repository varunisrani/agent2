import axios from 'axios';
import { htmlToText } from 'html-to-text';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from '@langchain/core/documents';
import pdfParse from 'pdf-parse';
import logger from './logger';

export const getDocumentsFromLinks = async ({ links }: { links: string[] }) => {
  const splitter = new RecursiveCharacterTextSplitter();

  let docs: Document[] = [];

  await Promise.all(
    links.map(async (link) => {
      link =
        link.startsWith('http://') || link.startsWith('https://')
          ? link
          : `https://${link}`;

      try {
        const res = await axios.get(link, {
          responseType: 'arraybuffer',
        });

        const isPdf = res.headers['content-type'] === 'application/pdf';

        if (isPdf) {
          const pdfText = await pdfParse(res.data);
          const parsedText = pdfText.text
            .replace(/(\r\n|\n|\r)/gm, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          const splitDocs = await splitter.createDocuments([parsedText]);
          docs.push(
            ...splitDocs.map(
              (doc) =>
                new Document({
                  pageContent: doc.pageContent,
                  metadata: {
                    url: link,
                    title: pdfText.info?.Title || link,
                  },
                }),
            ),
          );
        } else {
          const text = htmlToText(res.data.toString(), {
            wordwrap: false,
            selectors: [
              { selector: 'a', options: { ignoreHref: true } },
              { selector: 'img', format: 'skip' },
            ],
          });

          const splitDocs = await splitter.createDocuments([text]);
          docs.push(
            ...splitDocs.map(
              (doc) =>
                new Document({
                  pageContent: doc.pageContent,
                  metadata: {
                    url: link,
                    title: link,
                  },
                }),
            ),
          );
        }
      } catch (err) {
        logger.error(`Error processing link ${link}: ${err instanceof Error ? err.message : String(err)}`);
        // Continue with other links even if one fails
      }
    }),
  );

  return docs;
};