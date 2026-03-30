import { useState, useRef } from 'react'
import { X, Upload, Download, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import Papa from 'papaparse'
import { questionsApi } from '../../utils/api.js'

export default function ImportQuestionsModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState([])
  const [errors, setErrors] = useState([])
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setErrors([])
    
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validationErrors = validateData(results.data)
        setErrors(validationErrors)
        setPreview(results.data.slice(0, 5)) // Show first 5 rows
      },
      error: (error) => {
        setErrors([`CSV parsing error: ${error.message}`])
      }
    })
  }

  const validateData = (data) => {
    const errors = []
    
    if (data.length === 0) {
      errors.push('CSV file is empty')
      return errors
    }

    const requiredFields = ['questionText', 'type', 'category', 'difficulty']
    const validTypes = ['MULTIPLE_CHOICE', 'SHORT_ANSWER', 'CODE']
    const validDifficulties = ['EASY', 'MEDIUM', 'HARD']

    data.forEach((row, index) => {
      const rowNum = index + 2 // +2 because row 1 is header
      
      // Check required fields
      requiredFields.forEach(field => {
        if (!row[field] || row[field].trim() === '') {
          errors.push(`Row ${rowNum}: Missing required field "${field}"`)
        }
      })

      // Validate type
      if (row.type && !validTypes.includes(row.type.trim().toUpperCase())) {
        errors.push(`Row ${rowNum}: Invalid type "${row.type}". Must be one of: ${validTypes.join(', ')}`)
      }

      // Validate difficulty
      if (row.difficulty && !validDifficulties.includes(row.difficulty.trim().toUpperCase())) {
        errors.push(`Row ${rowNum}: Invalid difficulty "${row.difficulty}". Must be one of: ${validDifficulties.join(', ')}`)
      }

      // For multiple choice, check choices
      if (row.type?.trim().toUpperCase() === 'MULTIPLE_CHOICE') {
        if (!row.choice1 || !row.choice2) {
          errors.push(`Row ${rowNum}: Multiple choice questions require at least 2 choices (choice1, choice2)`)
        }
        if (!row.correctChoice) {
          errors.push(`Row ${rowNum}: Multiple choice questions require a correctChoice field (1, 2, 3, or 4)`)
        }
      }
    })

    return errors
  }

  const handleImport = async () => {
    if (errors.length > 0) return
    
    setImporting(true)
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          // Transform CSV data to match API format
          const questions = results.data.map(row => ({
            questionText: row.questionText.trim(),
            type: row.type.trim().toUpperCase(),
            category: row.category.trim(),
            difficulty: row.difficulty.trim().toUpperCase(),
            codeSnippet: row.codeSnippet?.trim() || null,
            choices: row.type.trim().toUpperCase() === 'MULTIPLE_CHOICE' 
              ? [
                  row.choice1?.trim(),
                  row.choice2?.trim(),
                  row.choice3?.trim(),
                  row.choice4?.trim()
                ].filter(Boolean).map((text, idx) => ({
                  choiceText: text,
                  isCorrect: (idx + 1).toString() === row.correctChoice?.trim()
                }))
              : []
          }))

          await questionsApi.importCsv(questions)

          setImported(true)
          setTimeout(() => {
            onSuccess()
          }, 1500)
        } catch (err) {
          setErrors([`Import error: ${err.message}`])
        } finally {
          setImporting(false)
        }
      }
    })
  }

  const downloadTemplate = () => {
    const template = `questionText,type,category,difficulty,codeSnippet,explanation,choice1,choice2,choice3,choice4,correctChoice
What is 2+2?,MULTIPLE_CHOICE,Mathematics,EASY,,Simple addition,3,4,5,6,2
Explain REST API,SHORT_ANSWER,Web Development,MEDIUM,,REST stands for...,Write a function to reverse a string,CODE,Programming,MEDIUM,function reverse(str) { return str.split('').reverse().join(''); },Use split reverse and join methods,,,,,`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'questions_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Import Questions from CSV</h2>
            <p className="text-sm text-gray-500 mt-1">Upload a CSV file with your questions</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {imported ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Import Successful!</h3>
              <p className="text-gray-600 mt-2">Your questions have been imported successfully.</p>
            </div>
          ) : (
            <>
              {/* Template Download */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <FileText className="text-blue-600 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-medium text-blue-900">CSV Format Requirements</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Your CSV file must include these columns: questionText, type, category, difficulty
                    </p>
                    <p className="text-sm text-blue-700">
                      For multiple choice questions, also include: choice1, choice2, choice3, choice4, correctChoice (1-4)
                    </p>
                    <button
                      onClick={downloadTemplate}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                      <Download size={16} />
                      Download Template CSV
                    </button>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-gray-50 transition-all"
                >
                  <Upload className="mx-auto text-gray-400 mb-3" size={32} />
                  <p className="text-gray-600 font-medium">
                    {file ? file.name : 'Click to select a CSV file'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {file ? `${preview.length} rows previewed` : 'or drag and drop here'}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Errors */}
              {errors.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                    <div className="flex-1">
                      <p className="font-medium text-red-900">Validation Errors</p>
                      <ul className="mt-2 space-y-1 text-sm text-red-700 max-h-32 overflow-auto">
                        {errors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview */}
              {preview.length > 0 && errors.length === 0 && (
                <div className="mb-6">
                  <p className="font-medium text-gray-700 mb-2">Preview (first 5 rows)</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Question</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Type</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Category</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Difficulty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {preview.map((row, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 text-gray-900 truncate max-w-xs">{row.questionText}</td>
                            <td className="px-3 py-2 text-gray-600">{row.type}</td>
                            <td className="px-3 py-2 text-gray-600">{row.category}</td>
                            <td className="px-3 py-2 text-gray-600">{row.difficulty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          {!imported && (
            <button
              onClick={handleImport}
              disabled={!file || errors.length > 0 || importing}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Importing...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Import Questions
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
