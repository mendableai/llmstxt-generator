import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Page from '../../../app/(home)/page';

// Mock the hooks and components
jest.mock('../../../hooks/use-toast', () => ({
  toast: jest.fn(),
  useToast: () => ({ toast: jest.fn() })
}));

// Mock fetch
global.fetch = jest.fn();

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        llmstxt: 'Mocked llmstxt content',
        llmsFulltxt: 'Mocked llmsFulltxt content',
        enhancedOutput: 'Mocked enhanced output'
      })
    });
  });

  it('should render the page with feature toggles', () => {
    render(<Page />);
    
    // Check for the new feature toggles
    expect(screen.getByLabelText(/English Only/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Remove Headers\/Footers/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Clean Export/i)).toBeInTheDocument();
  });

  it('should toggle the English filter option', async () => {
    render(<Page />);
    
    const filterEnglishToggle = screen.getByLabelText(/English Only/i);
    
    // Initially should be off
    expect(filterEnglishToggle).not.toBeChecked();
    
    // Toggle on
    await userEvent.click(filterEnglishToggle);
    expect(filterEnglishToggle).toBeChecked();
    
    // Toggle off
    await userEvent.click(filterEnglishToggle);
    expect(filterEnglishToggle).not.toBeChecked();
  });

  it('should toggle the headers/footers removal option', async () => {
    render(<Page />);
    
    const removeHeadersFootersToggle = screen.getByLabelText(/Remove Headers\/Footers/i);
    
    // Initially should be off
    expect(removeHeadersFootersToggle).not.toBeChecked();
    
    // Toggle on
    await userEvent.click(removeHeadersFootersToggle);
    expect(removeHeadersFootersToggle).toBeChecked();
    
    // Toggle off
    await userEvent.click(removeHeadersFootersToggle);
    expect(removeHeadersFootersToggle).not.toBeChecked();
  });

  it('should toggle the clean export option', async () => {
    render(<Page />);
    
    const cleanExportToggle = screen.getByLabelText(/Clean Export/i);
    
    // Initially should be off
    expect(cleanExportToggle).not.toBeChecked();
    
    // Toggle on
    await userEvent.click(cleanExportToggle);
    expect(cleanExportToggle).toBeChecked();
    
    // Toggle off
    await userEvent.click(cleanExportToggle);
    expect(cleanExportToggle).not.toBeChecked();
  });

  it('should pass the feature toggle values to the API call', async () => {
    render(<Page />);
    
    // Enter a URL
    const urlInput = screen.getByPlaceholderText(/Enter a URL/i);
    await userEvent.type(urlInput, 'https://example.com');
    
    // Toggle on all features
    await userEvent.click(screen.getByLabelText(/English Only/i));
    await userEvent.click(screen.getByLabelText(/Remove Headers\/Footers/i));
    await userEvent.click(screen.getByLabelText(/Clean Export/i));
    
    // Submit the form
    const generateButton = screen.getByText(/Generate/i);
    await userEvent.click(generateButton);
    
    // Verify that fetch was called with the correct options
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/service',
        expect.objectContaining({
          method: 'POST',
          headers: expect.any(Object),
          body: expect.stringContaining('"filterEnglish":true'),
        })
      );
      
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/service',
        expect.objectContaining({
          body: expect.stringContaining('"removeHeadersFooters":true'),
        })
      );
      
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/service',
        expect.objectContaining({
          body: expect.stringContaining('"cleanExport":true'),
        })
      );
    });
  });

  it('should display enhanced output when available', async () => {
    // Mock the API response with enhanced output
    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        llmstxt: 'Original content',
        llmsFulltxt: 'Full original content',
        enhancedOutput: 'Enhanced processed content'
      })
    });
    
    render(<Page />);
    
    // Enter a URL and submit
    const urlInput = screen.getByPlaceholderText(/Enter a URL/i);
    await userEvent.type(urlInput, 'https://example.com');
    
    // Toggle on a feature
    await userEvent.click(screen.getByLabelText(/English Only/i));
    
    // Submit the form
    const generateButton = screen.getByText(/Generate/i);
    await userEvent.click(generateButton);
    
    // Wait for the enhanced output to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Enhanced Output/i)).toBeInTheDocument();
      expect(screen.getByText(/Enhanced processed content/i)).toBeInTheDocument();
    });
    
    // Check for the "Copy Enhanced Output" button
    expect(screen.getByText(/Copy Enhanced Output/i)).toBeInTheDocument();
  });
});