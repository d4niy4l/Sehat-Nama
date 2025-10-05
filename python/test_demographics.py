#!/usr/bin/env python3
"""
Test script to verify the divided demographics functionality
"""

from llm import UrduMedicalHistorySystem
import json

def test_demographics_sections():
    """Test the new divided demographics sections"""
    
    print("=" * 60)
    print("TESTING DIVIDED DEMOGRAPHICS SECTIONS")
    print("=" * 60)
    
    # Initialize the system
    system = UrduMedicalHistorySystem()
    
    # Check the section order
    print("\n📋 New Section Order:")
    for i, section in enumerate(system.sections_order, 1):
        print(f"{i}. {section}")
    
    # Check the prompts for each demographic section
    print("\n📝 Demographics Section Prompts:")
    print("-" * 40)
    
    demographic_sections = [
        'patient_name',
        'patient_age', 
        'patient_gender',
        'patient_occupation',
        'patient_address',
        'patient_contact'
    ]
    
    for section in demographic_sections:
        if section in system.prompt_builder.SECTION_PROMPTS:
            print(f"\n🔸 {section.upper()}:")
            print(system.prompt_builder.SECTION_PROMPTS[section])
    
    # Test the flow by starting an interview
    print("\n" + "=" * 60)
    print("TESTING INTERVIEW FLOW")
    print("=" * 60)
    
    # Start interview
    result = system.start_interview()
    print(f"\n🤖 First Question: {result['ai_message']}")
    print(f"📍 Current Section: {result['state']['current_section']}")
    
    # Simulate going through each demographic section
    state = result['state']
    test_responses = {
        'patient_name': 'Muhammad Ahmed Khan',
        'patient_age': '35 سال',
        'patient_gender': 'مرد',
        'patient_occupation': 'Teacher',
        'patient_address': 'Karachi',
        'patient_contact': '03001234567'
    }
    
    print("\n🔄 Simulating responses for each demographic section:")
    
    for section in demographic_sections:
        if state['current_section'] == section:
            response = test_responses.get(section, 'Test response')
            print(f"\n👤 Patient: {response}")
            
            # Process the message
            result = system.process_user_message(state, response)
            state = result['state']
            
            print(f"🤖 AI: {result['ai_message']}")
            print(f"📍 Current Section: {state['current_section']}")
            print(f"📊 Collected: {json.dumps(state['collected_data'], ensure_ascii=False, indent=2)}")
            
            if state['all_sections_done']:
                print("\n✅ All sections completed!")
                break
    
    print("\n" + "=" * 60)
    print("TEST COMPLETED")
    print("=" * 60)

if __name__ == "__main__":
    test_demographics_sections()
