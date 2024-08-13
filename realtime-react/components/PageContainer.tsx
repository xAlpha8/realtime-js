export type TPageContainerProps = React.PropsWithChildren;
export function PageContainer(props: TPageContainerProps) {
  const { children } = props;
  return (
    <div className="page-container">
      <div className="page-wrapper">{children}</div>
    </div>
  );
}
