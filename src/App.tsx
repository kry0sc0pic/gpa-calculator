import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  PlusCircle, 
  LayoutGrid, 
  BarChart, 
  FileDown, 
  ChevronDown, 
  ChevronRight,
  Download,
  Upload
} from 'lucide-react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface Semester {
  id: string;
  name: string;
  credits: string;
  grade: string;
}

interface SemesterGroup {
  id: string;
  semesters: Semester[];
}

type Tab = 'data' | 'statistics';

const GRADES = ['10', '9', '8', '7', '6', '5', '4', '0'];

const calculateSGPA = (semesters: Semester[]): number => {
  let totalPoints = 0;
  let totalCredits = 0;

  semesters.forEach((sem) => {
    const credits = parseFloat(sem.credits) || 0;
    const grade = parseFloat(sem.grade) || 0;
    totalPoints += credits * grade;
    totalCredits += credits;
  });

  return totalCredits === 0 ? 0 : Number((totalPoints / totalCredits).toFixed(2));
};

const calculateCGPA = (semesterGroups: SemesterGroup[], upToIndex?: number): number => {
  let totalPoints = 0;
  let totalCredits = 0;

  const endIndex = upToIndex !== undefined ? upToIndex + 1 : semesterGroups.length;
  
  semesterGroups.slice(0, endIndex).forEach((group) => {
    group.semesters.forEach((sem) => {
      const credits = parseFloat(sem.credits) || 0;
      const grade = parseFloat(sem.grade) || 0;
      totalPoints += credits * grade;
      totalCredits += credits;
    });
  });

  return totalCredits === 0 ? 0 : Number((totalPoints / totalCredits).toFixed(2));
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  semesterSection: {
    marginBottom: 20,
    borderBottom: '1px solid #eee',
    paddingBottom: 15,
  },
  semesterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
    padding: '8px 12px',
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
    paddingBottom: 5,
    marginBottom: 5,
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666666',
  },
  courseRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    borderBottomStyle: 'solid',
  },
  courseName: {
    flex: 2,
    fontSize: 10,
    paddingRight: 10,
  },
  credits: {
    flex: 1,
    fontSize: 10,
    textAlign: 'center',
  },
  grade: {
    flex: 1,
    fontSize: 10,
    textAlign: 'center',
  },
  summary: {
    marginTop: 15,
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 4,
  },
  summaryText: {
    fontSize: 10,
    color: '#333333',
    marginBottom: 3,
  },
  finalSummary: {
    marginTop: 30,
    textAlign: 'center',
    borderTop: '2px solid #000',
    paddingTop: 20,
  },
  finalSummaryText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 10,
    color: '#666666',
  },
});

const GradeReport = ({ semesterGroups }: { semesterGroups: SemesterGroup[] }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {semesterGroups.map((group, index) => (
          <View key={group.id} style={styles.semesterSection}>
            <Text style={styles.semesterTitle}>Semester {group.id}</Text>
            
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>COURSE NAME</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>CREDITS</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>GRADE</Text>
            </View>
            
            {group.semesters.map((semester) => (
              <View key={semester.id} style={styles.courseRow}>
                <Text style={styles.courseName}>{semester.name || 'Unnamed Course'}</Text>
                <Text style={styles.credits}>{semester.credits || '0'}</Text>
                <Text style={styles.grade}>{semester.grade || 'N/A'}</Text>
              </View>
            ))}
            
            <View style={styles.summary}>
              <Text style={styles.summaryText}>
                Semester GPA (SGPA): {calculateSGPA(group.semesters)}
              </Text>
              <Text style={styles.summaryText}>
                Cumulative GPA (CGPA): {calculateCGPA(semesterGroups, index)}
              </Text>
            </View>
          </View>
        ))}
        
        <View style={styles.finalSummary}>
          <Text style={styles.finalSummaryText}>
            Final CGPA: {calculateCGPA(semesterGroups)}
          </Text>
        </View>

        <Text style={styles.footer}>
          Generated at https://gpa.krishaay.dev
        </Text>
      </Page>
    </Document>
  );
};

const GradeGraph = ({ semesterGroups }: { semesterGroups: SemesterGroup[] }) => {
  const sgpaData = semesterGroups.map((group, index) => ({
    semester: group.id,
    sgpa: calculateSGPA(group.semesters),
    cgpa: calculateCGPA(semesterGroups, index)
  }));

  const maxGrade = Math.max(...sgpaData.map(d => Math.max(d.sgpa, d.cgpa)), 10);
  const minGrade = Math.min(...sgpaData.map(d => Math.min(d.sgpa, d.cgpa)), 0);
  const range = maxGrade - minGrade;

  const graphHeight = 300;
  const graphWidth = Math.min(600, window.innerWidth - 80);
  const padding = 40;
  const availableHeight = graphHeight - 2 * padding;
  const availableWidth = graphWidth - 2 * padding;

  const scaleY = (value: number) => 
    graphHeight - padding - ((value - minGrade) / range * availableHeight);

  const scaleX = (index: number) => 
    padding + (index * (availableWidth / (sgpaData.length - 1)));

  if (sgpaData.length < 2) {
    return (
      <div className="text-zinc-400 text-center py-8">
        Add more semesters to view the grade progression graph
      </div>
    );
  }

  return (
    <svg width={graphWidth} height={graphHeight} className="mx-auto">
      <line
        x1={padding}
        y1={padding}
        x2={padding}
        y2={graphHeight - padding}
        stroke="currentColor"
        strokeOpacity="0.2"
      />
      
      <line
        x1={padding}
        y1={graphHeight - padding}
        x2={graphWidth - padding}
        y2={graphHeight - padding}
        stroke="currentColor"
        strokeOpacity="0.2"
      />

      {[0, 2, 4, 6, 8, 10].map((grade) => (
        <g key={grade}>
          <line
            x1={padding}
            y1={scaleY(grade)}
            x2={graphWidth - padding}
            y2={scaleY(grade)}
            stroke="currentColor"
            strokeOpacity="0.1"
            strokeDasharray="4"
          />
          <text
            x={padding - 5}
            y={scaleY(grade)}
            textAnchor="end"
            alignmentBaseline="middle"
            className="text-xs fill-current text-zinc-400"
          >
            {grade}
          </text>
        </g>
      ))}

      <path
        d={sgpaData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(d.sgpa)}`).join(' ')}
        stroke="white"
        strokeWidth="2"
        fill="none"
      />

      <path
        d={sgpaData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(d.cgpa)}`).join(' ')}
        stroke="white"
        strokeWidth="2"
        strokeDasharray="4"
        fill="none"
      />

      {sgpaData.map((d, i) => (
        <g key={i}>
          <text
            x={scaleX(i)}
            y={graphHeight - padding + 20}
            textAnchor="middle"
            className="text-xs fill-current text-zinc-400"
          >
            Sem {d.semester}
          </text>
          
          <circle
            cx={scaleX(i)}
            cy={scaleY(d.sgpa)}
            r="4"
            className="fill-white"
          />
          
          <circle
            cx={scaleX(i)}
            cy={scaleY(d.cgpa)}
            r="4"
            className="fill-white"
          />
        </g>
      ))}

      <g transform={`translate(${graphWidth - padding - 100}, ${padding})`}>
        <line x1="0" y1="0" x2="20" y2="0" stroke="white" strokeWidth="2" />
        <text x="25" y="0" alignmentBaseline="middle" className="text-xs fill-current">SGPA</text>
        <line x1="0" y1="20" x2="20" y2="20" stroke="white" strokeWidth="2" strokeDasharray="4" />
        <text x="25" y="20" alignmentBaseline="middle" className="text-xs fill-current">CGPA</text>
      </g>
    </svg>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('data');
  const [expandedSemesters, setExpandedSemesters] = useState<Set<string>>(new Set());
  const [semesterGroups, setSemesterGroups] = useState<SemesterGroup[]>(() => {
    const saved = localStorage.getItem('semesterData');
    return saved ? JSON.parse(saved) : [
      {
        id: '1',
        semesters: [{ id: '1-1', name: '', credits: '', grade: '' }]
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('semesterData', JSON.stringify(semesterGroups));
  }, [semesterGroups]);

  const toggleSemester = (semesterId: string) => {
    setExpandedSemesters(prev => {
      const next = new Set(prev);
      if (next.has(semesterId)) {
        next.delete(semesterId);
      } else {
        next.add(semesterId);
      }
      return next;
    });
  };

  const addSemester = (groupId: string) => {
    setSemesterGroups(groups => groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          semesters: [
            ...group.semesters,
            { id: `${groupId}-${group.semesters.length + 1}`, name: '', credits: '', grade: '' }
          ]
        };
      }
      return group;
    }));
  };

  const removeSemester = (groupId: string, semesterId: string) => {
    setSemesterGroups(prevGroups => {
      const group = prevGroups.find(g => g.id === groupId);
      if (!group) return prevGroups;

      const updatedSemesters = group.semesters.filter(sem => sem.id !== semesterId);

      if (updatedSemesters.length === 0 && prevGroups.length > 1) {
        const filteredGroups = prevGroups.filter(g => g.id !== groupId);
        return filteredGroups.map((group, index) => ({
          ...group,
          id: String(index + 1)
        }));
      }

      return prevGroups.map(g => 
        g.id === groupId ? { ...g, semesters: updatedSemesters } : g
      );
    });
  };

  const addSemesterGroup = () => {
    const newGroupId = String(semesterGroups.length + 1);
    setSemesterGroups(groups => [
      ...groups,
      {
        id: newGroupId,
        semesters: [{ id: `${newGroupId}-1`, name: '', credits: '', grade: '' }]
      }
    ]);
    setExpandedSemesters(prev => new Set(prev).add(newGroupId));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, groupId: string, semesterId: string, field: 'name' | 'credits' | 'grade') => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const lines = pastedText.split(/[\n\r]+/).filter(line => line.trim());

    if (lines.length <= 1) {
      // Single line paste
      if (field === 'name') {
        // For course name field, check if it contains tab-separated values
        const parts = pastedText.split(/[\t]+/).map(part => part.trim());
        if (parts.length >= 3) {
          // If we have at least 3 columns, update all fields
          updateSemester(groupId, semesterId, 'name', parts[0]);
          updateSemester(groupId, semesterId, 'credits', parts[1]);
          updateSemester(groupId, semesterId, 'grade', parts[2]);
          return;
        }
      }
      updateSemester(groupId, semesterId, field, pastedText);
      return;
    }

    const group = semesterGroups.find(g => g.id === groupId);
    if (!group) return;

    const semesterIndex = group.semesters.findIndex(s => s.id === semesterId);
    if (semesterIndex === -1) return;

    const updatedSemesters = [...group.semesters];
    
    lines.forEach((line, index) => {
      const parts = line.split(/[\t]+/).map(part => part.trim());
      
      if (index === 0) {
        if (parts.length >= 3) {
          // Update all fields for the first row
          updatedSemesters[semesterIndex] = {
            ...updatedSemesters[semesterIndex],
            name: parts[0],
            credits: parts[1],
            grade: parts[2]
          };
        } else {
          // Update only the pasted field
          updatedSemesters[semesterIndex] = {
            ...updatedSemesters[semesterIndex],
            [field]: line.trim()
          };
        }
      } else {
        const existingNext = updatedSemesters[semesterIndex + index];
        if (existingNext) {
          if (parts.length >= 3) {
            updatedSemesters[semesterIndex + index] = {
              ...existingNext,
              name: parts[0],
              credits: parts[1],
              grade: parts[2]
            };
          } else {
            updatedSemesters[semesterIndex + index] = {
              ...existingNext,
              [field]: line.trim()
            };
          }
        } else {
          if (parts.length >= 3) {
            updatedSemesters.push({
              id: `${groupId}-${crypto.randomUUID()}`,
              name: parts[0],
              credits: parts[1],
              grade: parts[2]
            });
          } else {
            updatedSemesters.push({
              id: `${groupId}-${crypto.randomUUID()}`,
              name: field === 'name' ? line.trim() : '',
              credits: field === 'credits' ? line.trim() : '',
              grade: field === 'grade' ? line.trim() : ''
            });
          }
        }
      }
    });

    setSemesterGroups(groups => groups.map(g => 
      g.id === groupId ? { ...g, semesters: updatedSemesters } : g
    ));
  };

  const updateSemester = (groupId: string, semesterId: string, field: 'name' | 'credits' | 'grade', value: string) => {
    setSemesterGroups(groups => groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          semesters: group.semesters.map(sem => {
            if (sem.id === semesterId) {
              return { ...sem, [field]: value };
            }
            return sem;
          })
        };
      }
      return group;
    }));
  };

  const cgpa = calculateCGPA(semesterGroups);

  const exportToJSON = () => {
    const dataStr = JSON.stringify(semesterGroups, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gpa-data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importFromJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);
        
        // Validate the imported data structure
        if (Array.isArray(importedData) && importedData.every(group => 
          group.id && Array.isArray(group.semesters)
        )) {
          setSemesterGroups(importedData);
          // Clear the file input
          event.target.value = '';
        } else {
          alert('Invalid JSON format. Please ensure the file contains valid semester data.');
        }
      } catch {
        alert('Error reading file. Please ensure it is a valid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-black p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-semibold mb-2 text-center text-white">
          CGPA/SGPA Calculator
        </h1>
        <p className="text-zinc-400 text-center text-sm mb-6 sm:mb-8 px-4">
          All data is stored locally on your device. No information is shared or stored on any external servers.
        </p>

        <div className="flex gap-2 sm:gap-4 mb-6 sm:mb-8 justify-center">
          <button
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'data' 
                ? 'bg-white text-black' 
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <LayoutGrid size={18} />
            <span className="hidden sm:inline">Data Entry</span>
            <span className="sm:hidden">Data</span>
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'statistics' 
                ? 'bg-white text-black' 
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <BarChart size={18} />
            <span className="hidden sm:inline">Statistics</span>
            <span className="sm:hidden">Stats</span>
          </button>
        </div>

        {activeTab === 'data' ? (
          <>
            <div className="space-y-4 sm:space-y-8">
              {semesterGroups.map((group, index) => (
                <div key={group.id} className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                  <div 
                    className="p-3 sm:p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center cursor-pointer hover:bg-zinc-800 transition-colors gap-2 sm:gap-0"
                    onClick={() => toggleSemester(group.id)}
                  >
                    <div className="flex items-center gap-2">
                      {expandedSemesters.has(group.id) ? (
                        <ChevronDown size={20} className="text-zinc-400" />
                      ) : (
                        <ChevronRight size={20} className="text-zinc-400" />
                      )}
                      <h2 className="text-lg sm:text-xl text-white">Semester {group.id}</h2>
                    </div>
                    <div className="flex gap-4 sm:gap-6 text-sm sm:text-base">
                      <div>
                        <span className="text-zinc-400">SGPA: </span>
                        <span className="text-white font-semibold">
                          {calculateSGPA(group.semesters)}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400">Rolling CGPA: </span>
                        <span className="text-white font-semibold">
                          {calculateCGPA(semesterGroups, index)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {expandedSemesters.has(group.id) && (
                    <div className="p-4 sm:p-6 border-t border-zinc-800">
                      <div className="space-y-3 sm:space-y-4">
                        {group.semesters.map((semester) => (
                          <div key={semester.id} className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center">
                            <input
                              type="text"
                              placeholder="Course Name"
                              value={semester.name}
                              onChange={(e) => updateSemester(group.id, semester.id, 'name', e.target.value)}
                              onPaste={(e) => handlePaste(e, group.id, semester.id, 'name')}
                              className="input-field flex-grow"
                            />
                            <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
                              <input
                                type="number"
                                placeholder="Credits"
                                value={semester.credits}
                                onChange={(e) => updateSemester(group.id, semester.id, 'credits', e.target.value)}
                                onPaste={(e) => handlePaste(e, group.id, semester.id, 'credits')}
                                className="input-field w-full sm:w-24"
                              />
                              <select
                                value={semester.grade}
                                onChange={(e) => updateSemester(group.id, semester.id, 'grade', e.target.value)}
                                className="input-field w-full sm:w-24"
                              >
                                <option value="">Grade</option>
                                {GRADES.map(grade => (
                                  <option key={grade} value={grade}>{grade}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => removeSemester(group.id, semester.id)}
                                className="text-zinc-400 hover:text-white p-2 sm:p-0"
                                disabled={group.semesters.length === 1 && semesterGroups.length === 1}
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4">
                        <button
                          onClick={() => addSemester(group.id)}
                          className="flex items-center gap-2 text-zinc-400 hover:text-white"
                        >
                          <PlusCircle size={20} />
                          Add Course
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex flex-wrap gap-2 sm:gap-4 w-full sm:w-auto">
                <button
                  onClick={addSemesterGroup}
                  className="btn btn-primary flex items-center gap-2 flex-1 sm:flex-none justify-center"
                >
                  <PlusCircle size={20} />
                  <span className="hidden sm:inline">Add Semester</span>
                  <span className="sm:hidden">Add</span>
                </button>
                <PDFDownloadLink
                  document={<GradeReport semesterGroups={semesterGroups} />}
                  fileName="academic-report.pdf"
                  className="btn btn-primary flex items-center gap-2 flex-1 sm:flex-none justify-center"
                >
                  {({ loading }) => (
                    <>
                      <FileDown size={20} />
                      <span className="hidden sm:inline">{loading ? 'Generating PDF...' : 'Download Report'}</span>
                      <span className="sm:hidden">{loading ? 'Generating...' : 'Download'}</span>
                    </>
                  )}
                </PDFDownloadLink>
                <button
                  onClick={exportToJSON}
                  className="btn btn-primary flex items-center gap-2 flex-1 sm:flex-none justify-center"
                >
                  <Download size={20} />
                  <span className="hidden sm:inline">Export JSON</span>
                  <span className="sm:hidden">Export</span>
                </button>
                <label className="btn btn-primary flex items-center gap-2 flex-1 sm:flex-none justify-center cursor-pointer">
                  <Upload size={20} />
                  <span className="hidden sm:inline">Import JSON</span>
                  <span className="sm:hidden">Import</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={importFromJSON}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="text-lg sm:text-xl text-center sm:text-right">
                <span className="text-zinc-400">Overall CGPA: </span>
                <span className="text-white font-semibold">{cgpa}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-zinc-900 p-4 sm:p-6 rounded-lg border border-zinc-800 overflow-x-auto">
            <h2 className="text-lg sm:text-xl mb-6 text-center">Grade Progression</h2>
            <GradeGraph semesterGroups={semesterGroups} />
          </div>
        )}

        <div className="mt-8 text-center text-zinc-400">
          <p className="flex items-center justify-center gap-2">
            Created by{' '}
            <a
              href="https://krishaay.dev"
              target="_blank"
              className="text-white hover:text-zinc-200 inline-flex items-center gap-1"
            >
              Krishaay
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;