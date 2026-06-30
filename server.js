const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data store
const applications = [];

const STATUS = {
  PENDING: 'pending',
  REVIEWING: 'reviewing',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

const STATUS_LABELS = {
  pending: '접수 완료',
  reviewing: '심사 중',
  approved: '승인',
  rejected: '반려',
};

const DISEASE_CATEGORIES = [
  '암(악성신생물)',
  '희귀질환',
  '중증 심장질환',
  '중증 뇌질환',
  '중증 외상',
  '기타 중증질환',
];

// Seed sample data
function seedData() {
  const samples = [
    {
      id: uuidv4(),
      applicantName: '김민준',
      birthDate: '1985-03-15',
      phone: '010-1234-5678',
      address: '서울특별시 강남구 테헤란로 123',
      patientName: '김민준',
      relationship: 'self',
      hospitalName: '서울대학교병원',
      diseaseCategory: '암(악성신생물)',
      diagnosisName: '위암 2기',
      treatmentPeriodStart: '2024-01-10',
      treatmentPeriodEnd: '2024-06-30',
      totalMedicalCost: 12500000,
      insuranceCoverage: 8750000,
      requestedAmount: 3750000,
      incomeCertified: true,
      status: STATUS.APPROVED,
      reviewComment: '소득 기준 충족, 지원 승인',
      appliedAt: '2024-07-05T09:00:00Z',
      updatedAt: '2024-07-10T14:00:00Z',
    },
    {
      id: uuidv4(),
      applicantName: '이서연',
      birthDate: '1972-11-22',
      phone: '010-9876-5432',
      address: '경기도 수원시 팔달구 중부대로 456',
      patientName: '이서연',
      relationship: 'self',
      hospitalName: '아주대학교병원',
      diseaseCategory: '희귀질환',
      diagnosisName: '루게릭병(ALS)',
      treatmentPeriodStart: '2023-09-01',
      treatmentPeriodEnd: '2024-08-31',
      totalMedicalCost: 24000000,
      insuranceCoverage: 14400000,
      requestedAmount: 9600000,
      incomeCertified: true,
      status: STATUS.REVIEWING,
      reviewComment: '',
      appliedAt: '2024-09-01T10:30:00Z',
      updatedAt: '2024-09-02T08:00:00Z',
    },
    {
      id: uuidv4(),
      applicantName: '박지훈',
      birthDate: '1990-07-04',
      phone: '010-5555-7777',
      address: '부산광역시 해운대구 센텀중앙로 789',
      patientName: '박지훈',
      relationship: 'self',
      hospitalName: '부산대학교병원',
      diseaseCategory: '중증 심장질환',
      diagnosisName: '급성 심근경색',
      treatmentPeriodStart: '2024-03-20',
      treatmentPeriodEnd: '2024-04-15',
      totalMedicalCost: 8200000,
      insuranceCoverage: 5740000,
      requestedAmount: 2460000,
      incomeCertified: false,
      status: STATUS.REJECTED,
      reviewComment: '소득 기준 초과로 반려',
      appliedAt: '2024-05-01T11:00:00Z',
      updatedAt: '2024-05-08T16:00:00Z',
    },
    {
      id: uuidv4(),
      applicantName: '최수아',
      birthDate: '1965-01-30',
      phone: '010-2222-3333',
      address: '대구광역시 중구 달구벌대로 321',
      patientName: '최수아',
      relationship: 'self',
      hospitalName: '경북대학교병원',
      diseaseCategory: '중증 뇌질환',
      diagnosisName: '뇌졸중',
      treatmentPeriodStart: '2024-08-05',
      treatmentPeriodEnd: '2024-11-30',
      totalMedicalCost: 15800000,
      insuranceCoverage: 9480000,
      requestedAmount: 6320000,
      incomeCertified: true,
      status: STATUS.PENDING,
      reviewComment: '',
      appliedAt: '2024-12-01T14:20:00Z',
      updatedAt: '2024-12-01T14:20:00Z',
    },
  ];
  applications.push(...samples);
}

seedData();

// Routes

// Get all applications (admin)
app.get('/api/applications', (req, res) => {
  const { status, search } = req.query;
  let result = [...applications];

  if (status && status !== 'all') {
    result = result.filter((a) => a.status === status);
  }

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (a) =>
        a.applicantName.includes(q) ||
        a.patientName.includes(q) ||
        a.diagnosisName.toLowerCase().includes(q) ||
        a.hospitalName.includes(q)
    );
  }

  result.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

  res.json({
    total: result.length,
    applications: result,
    statusLabels: STATUS_LABELS,
    stats: {
      total: applications.length,
      pending: applications.filter((a) => a.status === STATUS.PENDING).length,
      reviewing: applications.filter((a) => a.status === STATUS.REVIEWING).length,
      approved: applications.filter((a) => a.status === STATUS.APPROVED).length,
      rejected: applications.filter((a) => a.status === STATUS.REJECTED).length,
    },
  });
});

// Get single application
app.get('/api/applications/:id', (req, res) => {
  const application = applications.find((a) => a.id === req.params.id);
  if (!application) return res.status(404).json({ error: '신청 내역을 찾을 수 없습니다.' });
  res.json({ application, statusLabels: STATUS_LABELS });
});

// Submit new application
app.post('/api/applications', (req, res) => {
  const {
    applicantName, birthDate, phone, address,
    patientName, relationship,
    hospitalName, diseaseCategory, diagnosisName,
    treatmentPeriodStart, treatmentPeriodEnd,
    totalMedicalCost, insuranceCoverage, requestedAmount,
    incomeCertified,
  } = req.body;

  const required = { applicantName, birthDate, phone, address, patientName, hospitalName, diseaseCategory, diagnosisName, treatmentPeriodStart, totalMedicalCost, requestedAmount };
  for (const [field, val] of Object.entries(required)) {
    if (!val) return res.status(400).json({ error: `필수 항목이 누락되었습니다: ${field}` });
  }

  const application = {
    id: uuidv4(),
    applicantName,
    birthDate,
    phone,
    address,
    patientName: patientName || applicantName,
    relationship: relationship || 'self',
    hospitalName,
    diseaseCategory,
    diagnosisName,
    treatmentPeriodStart,
    treatmentPeriodEnd: treatmentPeriodEnd || null,
    totalMedicalCost: Number(totalMedicalCost),
    insuranceCoverage: Number(insuranceCoverage) || 0,
    requestedAmount: Number(requestedAmount),
    incomeCertified: incomeCertified === 'true' || incomeCertified === true,
    status: STATUS.PENDING,
    reviewComment: '',
    appliedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  applications.push(application);
  res.status(201).json({ message: '신청이 완료되었습니다.', application });
});

// Update application status (admin review)
app.patch('/api/applications/:id/status', (req, res) => {
  const application = applications.find((a) => a.id === req.params.id);
  if (!application) return res.status(404).json({ error: '신청 내역을 찾을 수 없습니다.' });

  const { status, reviewComment } = req.body;
  if (!Object.values(STATUS).includes(status)) {
    return res.status(400).json({ error: '유효하지 않은 상태값입니다.' });
  }

  application.status = status;
  application.reviewComment = reviewComment || '';
  application.updatedAt = new Date().toISOString();

  res.json({ message: '상태가 업데이트되었습니다.', application });
});

// Delete application (admin)
app.delete('/api/applications/:id', (req, res) => {
  const index = applications.findIndex((a) => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: '신청 내역을 찾을 수 없습니다.' });

  applications.splice(index, 1);
  res.json({ message: '삭제되었습니다.' });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`의료비 지원 시스템 서버가 포트 ${PORT}에서 실행 중입니다.`);
});

module.exports = app;
