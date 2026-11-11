// supabaseClient.js
// 이 파일은 Supabase 클라이언트를 초기화합니다.
// .env 에 SUPABASE_URL 과 SUPABASE_ANON_KEY 가 정의되어 있으면 실제 Supabase 인스턴스를 만들고,
// 없을 경우 콘솔 경고와 함께 로컬Storage 기반 Mock 를 사용하도록 합니다.

(function(){
  const env = window.__ENV || {};
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_ANON_KEY;
  if (url && key) {
    // 실제 Supabase 클라이언트를 전역에 저장
    window.supabase = supabase.createClient(url, key);
    console.log('Supabase 클라이언트 초기화됨');
  } else {
    // Mock: supabase 가 null 이고, 로컬Storage 로 피드백을 저장/조회
    window.supabase = null;
    console.warn('Supabase 환경변수가 없으므로 로컬스토리지 Mock 를 사용합니다.');
  }
  // 전역 함수 제공
  window.getSupabaseClient = function(){ return window.supabase; };
})();

