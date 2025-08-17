import { describe, it, expect } from 'vitest';
import { sanitize, isSafeHtml } from './sanitize';

describe('sanitize', () => {
  it('should remove inline event handlers', () => {
    const html = '<div onclick="alert(1)">Click me</div>';
    const result = sanitize(html);
    expect(result).not.toContain('onclick');
    expect(result).toContain('Click me');
  });

  it('should remove script tags completely', () => {
    const html = '<div>Safe content</div><script>alert("xss")</script>';
    const result = sanitize(html);
    expect(result).not.toContain('script');
    expect(result).not.toContain('alert');
    expect(result).toContain('Safe content');
  });

  it('should remove style tags', () => {
    const html = '<div>Content</div><style>body { display: none; }</style>';
    const result = sanitize(html);
    expect(result).not.toContain('style');
    expect(result).not.toContain('display: none');
    expect(result).toContain('Content');
  });

  it('should remove iframe and embed tags', () => {
    const html =
      '<div>Safe</div><iframe src="evil.com"></iframe><embed src="bad.swf">';
    const result = sanitize(html);
    expect(result).not.toContain('iframe');
    expect(result).not.toContain('embed');
    expect(result).toContain('Safe');
  });

  it('should preserve safe HTML elements', () => {
    const html = `
      <h1>Title</h1>
      <p>Paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
      <ul>
        <li>List item</li>
      </ul>
      <blockquote>Quote</blockquote>
    `;
    const result = sanitize(html);
    expect(result).toContain('<h1>Title</h1>');
    expect(result).toContain('<strong>bold</strong>');
    expect(result).toContain('<em>italic</em>');
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>List item</li>');
    expect(result).toContain('<blockquote>Quote</blockquote>');
  });

  it('should add loading and decoding attributes to images', () => {
    const html = '<img src="test.jpg" alt="Test image">';
    const result = sanitize(html);
    expect(result).toContain('loading="lazy"');
    expect(result).toContain('decoding="async"');
    expect(result).toContain('alt="Test image"');
  });

  it('should add empty alt attribute to images without alt', () => {
    const html = '<img src="test.jpg">';
    const result = sanitize(html);
    expect(result).toContain('alt=""');
  });

  it('should make links open in new tabs with security attributes', () => {
    const html = '<a href="https://example.com">Link</a>';
    const result = sanitize(html);
    expect(result).toContain('target="_blank"');
    expect(result).toContain('rel="noopener noreferrer"');
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('Link');
  });

  it('should preserve allowed attributes and remove forbidden ones', () => {
    const html =
      '<div id="test" class="safe" onclick="alert(1)" data-custom="value">Content</div>';
    const result = sanitize(html);
    expect(result).toContain('id="test"');
    expect(result).toContain('class="safe"');
    expect(result).not.toContain('onclick');
    expect(result).not.toContain('data-custom'); // Not in allowed list
    expect(result).toContain('Content');
  });

  it('should remove dangerous protocols from links', () => {
    const html = '<a href="javascript:alert(1)">Bad link</a>';
    const result = sanitize(html);
    // DOMPurify should remove the dangerous href entirely
    expect(result).not.toContain('javascript:');
  });

  it('should handle complex XSS attempts', () => {
    const html = `
      <img src="x" onerror="alert(1)">
      <div style="background: url(javascript:alert(1))">Content</div>
      <svg onload="alert(1)"><circle cx="10" cy="10" r="5"/></svg>
    `;
    const result = sanitize(html);
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('onload');
    expect(result).not.toContain('javascript:');
    expect(result).not.toContain('alert');
    expect(result).not.toContain('svg'); // SVG not in allowed tags
  });
});

describe('isSafeHtml', () => {
  it('should return true for safe HTML', () => {
    const html = '<p>This is safe content with <strong>bold</strong> text.</p>';
    expect(isSafeHtml(html)).toBe(true);
  });

  it('should return false for HTML with dangerous content', () => {
    const html = '<script>alert("xss")</script><p>Some content</p>';
    expect(isSafeHtml(html)).toBe(false);
  });

  it('should return true for HTML with minor sanitization changes', () => {
    const html = '<p class="test">Content</p>';
    expect(isSafeHtml(html)).toBe(true);
  });

  it('should return false for HTML that gets heavily sanitized', () => {
    const dangerousHtml = `
      <script>alert(1)</script>
      <iframe src="evil.com"></iframe>
      <div onclick="alert(2)">
        <style>body { display: none; }</style>
        <p>Some content</p>
      </div>
    `;
    expect(isSafeHtml(dangerousHtml)).toBe(false);
  });
});
