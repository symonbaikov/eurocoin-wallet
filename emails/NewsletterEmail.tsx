import React from "react";
import { Section, Row, Column, Text, Link, Hr, Img } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";

interface NewsletterEmailProps {
  message: string;
  photoUrl?: string | null;
  unsubscribeUrl?: string;
}

// Parse Markdown links and convert to HTML
function parseMarkdownLinks(text: string): (string | React.ReactElement)[] {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  let match;
  let keyCounter = 0;

  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before link
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    // Add link
    parts.push(
      <Link key={`link-${keyCounter++}`} href={match[2]} style={linkStyle}>
        {match[1]}
      </Link>,
    );
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

export function NewsletterEmail({ message, photoUrl, unsubscribeUrl }: NewsletterEmailProps) {
  return (
    <EmailLayout title="EuroCoin Newsletter">
      <Section>
        <Row>
          <Column>
            {/* Image if provided */}
            {photoUrl && (
              <Section style={imageContainerStyle}>
                <Img src="cid:newsletter-image" alt="Newsletter Image" style={imageStyle} />
              </Section>
            )}

            {/* Message content */}
            <Section style={messageContainerStyle}>
              {message.split("\n").map((line, index) => {
                const parsedLine = parseMarkdownLinks(line);
                return (
                  <Text key={index} style={messageStyle}>
                    {parsedLine.length > 1 ? parsedLine : line || "\u00A0"}
                  </Text>
                );
              })}
            </Section>
          </Column>
        </Row>

        <Hr style={dividerStyle} />

        <Row>
          <Column>
            <Text style={footerTextStyle}>
              You received this email because you are subscribed to EuroCoin newsletter.
            </Text>
            {unsubscribeUrl && (
              <Text style={unsubscribeTextStyle}>
                <Link href={unsubscribeUrl} style={unsubscribeLinkStyle}>
                  Unsubscribe from newsletter
                </Link>
              </Text>
            )}
          </Column>
        </Row>
      </Section>
    </EmailLayout>
  );
}

const imageContainerStyle = {
  margin: "0 0 24px 0",
  textAlign: "center" as const,
};

const imageStyle = {
  maxWidth: "100%",
  height: "auto",
  borderRadius: "8px",
  border: "1px solid #E5E7EB",
};

const messageContainerStyle = {
  backgroundColor: "#F9FAFB",
  padding: "24px",
  borderRadius: "8px",
  margin: "24px 0",
  borderLeft: "4px solid #2563EB",
};

const messageStyle = {
  fontSize: "16px",
  color: "#111827",
  lineHeight: "1.6",
  margin: "0",
};

const linkStyle = {
  color: "#2563EB",
  textDecoration: "underline",
};

const dividerStyle = {
  border: "none",
  borderTop: "1px solid #E5E7EB",
  margin: "32px 0 24px 0",
};

const footerTextStyle = {
  fontSize: "14px",
  color: "#6B7280",
  margin: "0 0 12px 0",
  textAlign: "center" as const,
};

const unsubscribeTextStyle = {
  fontSize: "14px",
  margin: "0",
  textAlign: "center" as const,
};

const unsubscribeLinkStyle = {
  color: "#2563EB",
  textDecoration: "underline",
};
