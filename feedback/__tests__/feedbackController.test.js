import { isSuspiciousValueString } from '../../utilities/checkIfSuspicious.js'

describe('Feedback Controller - Suspicious Input Protection #feedback_unit', () => {
  
  describe('isSuspiciousValueString validation for feedback routes', () => {
    
    it('detects suspicious script tags in feedback', () => {
      const feedback = '<script>alert("xss")</script>'
      expect(isSuspiciousValueString(feedback)).toBe(true)
    })

    it('detects suspicious javascript: protocol in feedback', () => {
      const feedback = 'Click here: javascript:alert("xss")'
      expect(isSuspiciousValueString(feedback)).toBe(true)
    })

    it('detects suspicious function calls in feedback', () => {
      const feedback = 'This contains eval(someCode)'
      expect(isSuspiciousValueString(feedback)).toBe(true)
    })

    it('detects suspicious database commands in feedback', () => {
      const feedback = 'db.users.drop()'
      expect(isSuspiciousValueString(feedback)).toBe(true)
    })

    it('detects suspicious if statements in bug descriptions', () => {
      const bugDescription = 'Bug: if(true) { doSomething() }'
      expect(isSuspiciousValueString(bugDescription)).toBe(true)
    })

    it('detects suspicious system commands in bug descriptions', () => {
      const bugDescription = 'Issue with sudo service restart'
      expect(isSuspiciousValueString(bugDescription)).toBe(true)
    })

    it('detects suspicious for loops in feedback', () => {
      const feedback = 'for(let i=0; i<10; i++)'
      expect(isSuspiciousValueString(feedback)).toBe(true)
    })

    it('detects suspicious while loops in feedback', () => {
      const feedback = 'while(true) { console.log("test") }'
      expect(isSuspiciousValueString(feedback)).toBe(true)
    })

    it('detects suspicious fetch calls in feedback', () => {
      const feedback = 'fetch(apiUrl).then(res => res.json())'
      expect(isSuspiciousValueString(feedback)).toBe(true)
    })

    it('detects suspicious PHP tags in feedback', () => {
      const feedback = '<?php echo "test"; ?>'
      expect(isSuspiciousValueString(feedback)).toBe(true)
    })

    it('accepts safe feedback text with normal punctuation', () => {
      const feedback = 'This is safe feedback with normal punctuation! Great work.'
      expect(isSuspiciousValueString(feedback)).toBe(false)
    })

    it('accepts safe bug description text', () => {
      const bugDescription = 'The button does not work when I click it. Expected behavior is to save.'
      expect(isSuspiciousValueString(bugDescription)).toBe(false)
    })

    it('accepts feedback with parentheses in normal text', () => {
      const feedback = 'I love this feature (especially the new UI)!'
      expect(isSuspiciousValueString(feedback)).toBe(false)
    })

    it('accepts feedback with brackets in normal text', () => {
      const feedback = 'The [Save] button works well now.'
      expect(isSuspiciousValueString(feedback)).toBe(false)
    })

    it('accepts feedback with numbers and special characters', () => {
      const feedback = 'Bug #123: Cost is $5.00 (USD) - please fix!'
      expect(isSuspiciousValueString(feedback)).toBe(false)
    })

    it('accepts feedback with quotes and apostrophes', () => {
      const feedback = "I said 'hello' and it responded with \"hi there\""
      expect(isSuspiciousValueString(feedback)).toBe(false)
    })
  })
})

