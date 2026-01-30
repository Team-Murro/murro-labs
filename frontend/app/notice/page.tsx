import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "공지사항 - MURRO LABS",
  description: "MURRO LABS의 새로운 소식과 안내사항을 전해드립니다.",
};

// [핵심] 여기에 공지사항을 추가하면 자동으로 화면에 반영됩니다.
// 관리자 페이지 대신 이 배열만 관리하시면 됩니다.
const NOTICES = [
  {  
    id: 99,
    title: "🚀 배포 시스템 자동화 테스트 중입니다",
    date: "2026.01.30",
    content: `현재 CI/CD 파이프라인 구축 완료 후 자동 배포 기능을 테스트하고 있습니다.
    
    이 공지사항이 보인다면:
    1. GitHub Actions가 도커 이미지를 잘 구웠고
    2. k8s YAML 파일의 버전 태그를 자동으로 수정했고
    3. ArgoCD가 변경 사항을 감지해서 배포까지 성공했다는 뜻입니다!
    
    (테스트 후 삭제될 예정입니다)`,
    important: false,
  },	
  {
    id: 1,
    title: "🚧 MURRO LABS 서비스 리뉴얼 및 시범 운영 안내",
    date: "2026.01.30",
    content: `안녕하세요, 불확실한 일상에 확실한 즐거움을 더하는 Team. MURRO입니다.

    현재 머로랩스(MURRO LABS)는 더 안정적인 서비스와 새로운 기능을 제공하기 위해 **서비스 전면 리뉴얼**을 진행하고 있습니다.
    
    기존에 제공되던 AI 로또 분석 기능을 포함하여, 서버 인프라 교체 및 UI/UX 개선 작업이 동시에 이루어지고 있어 **일부 페이지가 미완성 상태이거나 이용이 원활하지 않을 수 있습니다.**

    매일매일 더 나은 모습으로 변화하고 있으니, 다소 불편하시더라도 너른 양해 부탁드립니다.
    
    이용 중 발견되는 오류나 건의사항은 언제든지 페이지 하단의 메일로 보내주시면 빠르게 반영하겠습니다.
    방문해 주셔서 감사합니다.`,
    important: true,
  },	
  {
    id: 2,
    title: "서비스 이용약관 개정 안내 (v1.0)",
    date: "2026.01.25",
    content: `서비스 런칭에 맞추어 이용약관이 제정되었습니다. 
    하단 푸터의 '서비스 이용약관' 링크를 통해 상세 내용을 확인하실 수 있습니다.`,
    important: false,
  },
];

export default function NoticePage() {
  return (
    <div className="py-12 px-4 min-h-[60vh]">
      {/* 헤더 섹션 */}
      <div className="mb-10 border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-bold text-slate-100 mb-2">공지사항</h1>
        <p className="text-sm text-slate-400">
          MURRO LABS의 주요 소식과 업데이트를 안내해 드립니다.
        </p>
      </div>

      {/* 공지사항 목록 (아코디언 스타일) */}
      <div className="space-y-4">
        {NOTICES.map((notice) => (
          <details
            key={notice.id}
            className="group bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden transition-all hover:border-slate-600 open:bg-slate-800 open:border-blue-500/50"
          >
            {/* 제목 줄 (클릭 시 열림) */}
            <summary className="flex items-center justify-between p-5 cursor-pointer list-none select-none">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  {notice.important && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">
                      공지
                    </span>
                  )}
                  <span className="font-medium text-slate-200 group-hover:text-blue-300 transition-colors">
                    {notice.title}
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  {notice.date}
                </span>
              </div>
              
              {/* 화살표 아이콘 */}
              <div className="text-slate-500 transition-transform group-open:rotate-180 group-open:text-blue-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </div>
            </summary>

            {/* 내용 영역 */}
            <div className="px-5 pb-5 text-sm text-slate-300 leading-relaxed whitespace-pre-line border-t border-slate-700/50 pt-4 mt-2 mx-2">
              {notice.content}
            </div>
          </details>
        ))}
      </div>

      {/* 게시글이 없을 경우 */}
      {NOTICES.length === 0 && (
        <div className="text-center py-20 text-slate-500 text-sm">
          등록된 공지사항이 없습니다.
        </div>
      )}
    </div>
  );
}
// trigger test
