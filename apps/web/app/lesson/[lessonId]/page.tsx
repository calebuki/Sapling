import { LessonSession } from '../../../components/LessonSession';

type LessonPageProps = {
  params: { lessonId: string };
};

export default function LessonPage({ params }: LessonPageProps) {
  const { lessonId } = params;
  return <LessonSession lessonId={lessonId} />;
}
