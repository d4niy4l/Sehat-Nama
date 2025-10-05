# Supabase Medical History Storage Integration

This document explains how to use the new medical history storage functionality that saves interview results to Supabase.

## Overview

The system now includes a new endpoint `/api/store-medical-history` that:
1. Takes completed medical interview data in Urdu
2. Translates each answer to English using Groq LLM
3. Stores both versions (Urdu original + English translation) in Supabase

## Database Schema

A new table `medical_history` has been added to store the results:

```sql
CREATE TABLE public.medical_history (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  urdu_version JSONB NOT NULL,
  english_version JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Environment Variables Required

Add these to your `.env` file:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key  # Already required for the interview system
```

## Usage

### 1. Complete a Medical Interview

First, complete a medical interview using the existing endpoints:
- `/api/start-interview-with-voice` - Start interview
- `/api/send-message-with-voice` - Continue conversation
- Monitor `is_complete` flag in responses

### 2. Store Results When Complete

When `is_complete` is `true`, call the storage endpoint:

```python
import requests

# Example collected_data from completed interview
medical_data = {
    "demographics": {
        "name": "احمد علی",
        "age": "پچیس سال", 
        "gender": "مرد",
        "occupation": "انجینئر"
    },
    "complaint": {
        "chief_complaint": "پیٹ میں درد ہو رہا ہے"
    },
    "hpc": {
        "pain_description": "درد تیز ہے اور کھانے کے بعد بڑھ جاتا ہے"
    }
    # ... other sections
}

# Store in Supabase
response = requests.post("https://sehatnamafastapi.onrender.com/api/store-medical-history", 
    json={
        "user_email": "patient@example.com",
        "medical_data": medical_data
    }
)

result = response.json()
print(result)
```

### 3. Response Format

Successful storage returns:

```json
{
  "success": true,
  "message": "Medical history stored successfully",
  "record_id": 123,
  "urdu_version": { /* original Urdu data */ },
  "english_version": { /* translated English data */ }
}
```

## Example Usage Endpoint

Visit `/api/example-store-usage` to see the expected data format and usage example.

## Translation Logic

- Each Urdu text field is individually translated to English using Groq LLM
- Non-text fields (numbers, empty values) remain unchanged
- If translation fails, the original text is preserved with an error note
- Uses "llama-3.1-8b-instant" model for fast, accurate translation

## Security

- Row Level Security (RLS) is enabled on the medical_history table
- Users can only access records where the email matches their authenticated email
- Supabase authentication policies automatically handle access control

## Error Handling

The endpoint handles various error scenarios:
- Missing Supabase configuration
- Translation failures
- Database insertion errors
- Invalid input data

All errors return appropriate HTTP status codes and descriptive messages.
